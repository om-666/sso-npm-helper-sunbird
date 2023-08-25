const _ = require('lodash');
const jwt = require('jsonwebtoken');
const envHelper = require('../../../helpers/environmentVariablesHelper');

const { encrypt, decrypt } = require('../../../helpers/crypto');
const {
  verifySignature, verifyIdentifier, verifyToken, fetchUserWithExternalId, createUser, fetchUserDetails,
  createSession, updateContact, updateRoles, sendSsoKafkaMessage, migrateUser, freeUpUser, getIdentifier,
  orgSearch
} = require('../helpers/ssoHelper');  
const telemetryHelper = require('../../../helpers/telemetryHelper');
const { generateAuthToken, getGrantFromCode } = require('../../../helpers/keyCloakHelperService');
const { parseJson, isDateExpired } = require('../../../helpers/utilityService');
const { getUserIdFromToken } = require('../../../helpers/jwtHelper'); //
const fs = require('fs');
const externalKey = envHelper.CRYPTO_ENCRYPTION_KEY_EXTERNAL;
const successUrl = '/sso/sign-in/success';
const updateContactUrl = '/sign-in/sso/update/contact';
const errorUrl = '/sso/sign-in/error';
const { logger } = require('@project-sunbird/logger');
const url = require('url');
const { acceptTncAndGenerateToken } = require('../../../helpers/userService');
const VDNURL = envHelper.vdnURL || 'https://dockstaging.sunbirded.org';
const { getAuthToken } = require('../../../helpers/kongTokenHelper');

function initializeRoute() {//initializeroutes function
    return  async (req, res) => { // updating api version to 2
        logger.info({msg: '/v2/user/session/create called'});
        let jwtPayload, userDetails, redirectUrl, errType, orgDetails;
        try {
          errType = 'VERIFY_SIGNATURE';
          await verifySignature(req.query.token); // it is coming from the ssohelper.js file
          jwtPayload = jwt.decode(req.query.token);
          if (!jwtPayload.state_id || !jwtPayload.school_id || !jwtPayload.name || !jwtPayload.sub) {
            errType = 'PAYLOAD_DATA_MISSING';
            throw 'some of the JWT payload is missing';
          }
          req.session.jwtPayload = jwtPayload;
          req.session.migrateAccountInfo = {
            stateToken: req.query.token
          };
          errType = 'VERIFY_TOKEN';
          verifyToken(jwtPayload); // it is comes from the ssohelper.js file
          errType = 'USER_FETCH_API';
          userDetails = await fetchUserWithExternalId(jwtPayload, req);// it is comes from the ssohelper.js file
          if (_.get(req,'cookies.redirectPath')){
            res.cookie ('userDetails', JSON.stringify(encrypt(userDetails.userName, externalKey)));
          }
          req.session.userDetails = userDetails;
          logger.info({msg: "userDetails fetched" + userDetails});
          if(!_.isEmpty(userDetails) && (userDetails.phone || userDetails.email)) {
            redirectUrl = successUrl + getEncyptedQueryParams({userName: userDetails.userName});
            logger.info({
              msg: 'sso session create v2 api, successfully redirected to success page',
              additionalInfo: {
                state_id: jwtPayload.state_id,
                jwtPayload: jwtPayload,
                query: req.query,
                userDetails: userDetails,
                redirectUrl: redirectUrl
              }
            })
          } else {
            errType = 'ORG_SEARCH';
            orgDetails = await orgSearch(jwtPayload.school_id, req);
            if (!(_.get(orgDetails, 'result.response.count') > 0)) {
              throw 'SCHOOL_ID_NOT_REGISTERED'
            }
            const dataToEncrypt = {
              identifier: (userDetails && userDetails.id) ? userDetails.id : ''
            };
            errType = 'ERROR_ENCRYPTING_DATA_SESSION_CREATE';
            req.session.userEncryptedInfo = encrypt(JSON.stringify(dataToEncrypt));
            redirectUrl = updateContactUrl; // verify phone then create user
            logger.info({
              msg:'sso session create v2 api, successfully redirected to update phone page',
              additionalInfo: {
                state_id: jwtPayload.state_id,
                jwtPayload: jwtPayload,
                query: req.query,
                userDetails: userDetails,
                redirectUrl: redirectUrl
              }
            })
          }
        } catch (error) {
          redirectUrl = `${errorUrl}?error_message=` + getErrorMessage(error, errType);
          logger.error({
            msg: 'sso session create v2 api failed',
            error,
            additionalInfo: {
              errorType: errType,
              jwtPayload: jwtPayload,
              query: req.query,
              userDetails: userDetails,
              redirectUrl: redirectUrl
            }
          })
          logErrorEvent(req, errType, error);
        } finally {
          res.redirect(redirectUrl || errorUrl);
        }
      }


}
function handleVerifiedContactRoute() {//contact verified
  return async (req, res) => {
    logger.info({msg: '/v1/sso/contact/verified called'});
    let userDetails, jwtPayload, redirectUrl, errType;
    jwtPayload = req.session.jwtPayload; // fetch from session
    userDetails = req.session.userDetails; // fetch from session
    try {
      let decryptedData;
      let otpDecryptedData;
      if (_.get(req, 'session.userEncryptedInfo')) {
        decryptedData = decrypt(req.session.userEncryptedInfo);
        decryptedData = JSON.parse(decryptedData);
      }
      if (_.get(req, 'session.otpEncryptedInfo')) {
        otpDecryptedData = decrypt(req.session.otpEncryptedInfo);
        otpDecryptedData = JSON.parse(otpDecryptedData);
      }
      // If data encrypted in session create route; `identifier` should match with the incoming request session user `identifier`
      if (_.get(decryptedData, 'identifier') !== '' && _.get(decryptedData, 'identifier') !== userDetails.identifier) {
        errType = 'FORBIDDEN';
        throw 'Access Forbidden - User identifier mismatch with session create payload';
      }
      if (_.isEmpty(jwtPayload) && ((!['phone', 'email', 'tncVersion', 'tncAccepted'].includes(req.query.type) && !req.query.value) || req.query.userId)) {
        errType = 'MISSING_QUERY_PARAMS';
        throw 'some of the query params are missing';
      }
      if (_.get(otpDecryptedData, req.query.type) !== req.query.value) {
        errType = 'FORBIDDEN';
        throw 'Access Forbidden - User identifier mismatch with OTP payload';
      }
      if (!_.isEmpty(userDetails) && !userDetails[req.query.type]) { // existing user without phone
        errType = 'UPDATE_CONTACT_DETAILS';
        await updateContact(req, userDetails).catch(handleProfileUpdateError); // api need to be verified
        if (req.query.tncAccepted === 'true') {
          errType = 'ACCEPT_TNC';
          await acceptTncAndGenerateToken(req.query.value, req.query.tncVersion).catch(handleProfileUpdateError);
        }
        logger.info({
          msg: 'sso phone updated successfully and redirected to success page',
          additionalInfo: {
            state_id: jwtPayload.state_id,
            phone: req.query.phone,
            jwtPayload: jwtPayload,
            userDetails: userDetails,
            errType: errType
          }
        })
      } else if (_.isEmpty(userDetails)) { // create user and update roles
        errType = 'CREATE_USER';
        const newUserDetails = await createUser(req, jwtPayload).catch(handleProfileUpdateError);
        await delay();
        if (jwtPayload.roles && jwtPayload.roles.length) {
          errType = 'UPDATE_USER_ROLES';
          await updateRoles(req, newUserDetails.result.userId, jwtPayload).catch(handleProfileUpdateError);
        }
        errType = 'FETCH_USER_AFTER_CREATE';
        userDetails = await fetchUserWithExternalId(jwtPayload, req); // to get userName
        if(_.isEmpty(userDetails)){
          errType = 'USER_DETAILS_EMPTY';
          throw 'USER_DETAILS_IS_EMPTY';
        }
        req.session.userDetails = userDetails;
        if (req.query.tncAccepted === 'true') {
          errType = 'ACCEPT_TNC';
          await acceptTncAndGenerateToken(userDetails.userName, req.query.tncVersion).catch(handleProfileUpdateError);
        }
        redirectUrl = successUrl + getEncyptedQueryParams({userName: userDetails.userName});
        logger.info({
          msg: 'sso user creation and role updated successfully and redirected to success page',
          additionalInfo: {
            state_id: jwtPayload.state_id,
            phone: req.query.phone,
            jwtPayload: jwtPayload,
            userDetails: userDetails,
            redirectUrl: redirectUrl,
            errType: errType
          }
        })
      }
    } catch (error) {
      redirectUrl = `${errorUrl}?error_message=` + getErrorMessage(error, errType);
      logger.error({
        msg: 'sso user creation/phone update failed, redirected to error page',
        error,
        additionalInfo: {
          state_Id: jwtPayload.state_id,
          errType: errType,
          queryParams: req.query,
          userDetails: userDetails,
          jwtPayload: jwtPayload,
          redirectUrl: redirectUrl,
        }
      })
      logErrorEvent(req, errType, error);
    } finally {
      res.redirect(redirectUrl || errorUrl);
    }
  };
}
function handleSuccessRedirect() {//handle success redirect
  return async (req, res) => {
    logger.info({ msg: '/v1/sso/success/redirect called' });
    let userDetails, jwtPayload, redirectUrl, errType, redirectURIFromCookie;
    jwtPayload = req.session.jwtPayload;
    userDetails = req.session.userDetails;
    try {
      if (_.isEmpty(jwtPayload) || _.isEmpty(userDetails)) {
        errType = 'MISSING_QUERY_PARAMS';
        throw 'some of the query params are missing';
      }
      errType = 'CREATE_SESSION';
      await createSession(userDetails.userName, 'portal', req, res);
      redirectURIFromCookie = _.get(req, 'cookies.SSO_REDIRECT_URI');
      if (redirectURIFromCookie) {
        const parsedRedirectURIFromCookie = url.parse(decodeURI(redirectURIFromCookie), true);
        delete parsedRedirectURIFromCookie.query.auth_callback;
        delete parsedRedirectURIFromCookie.search;
        redirectUrl = url.format(parsedRedirectURIFromCookie);
      } else {
        redirectUrl = jwtPayload.redirect_uri ? jwtPayload.redirect_uri : '/resources';
      }
      logger.info({
        msg: 'sso sign-in success callback, session created',
        additionalInfo: {
          state_Id: jwtPayload.state_id,
          query: req.query,
          redirectUrl: redirectUrl,
          errType: errType
        }
      });
    } catch (error) {
      redirectUrl = `${errorUrl}?error_message=` + getErrorMessage(error, errType);
      logger.error({
        msg: 'sso sign-in success callback, create session error',
        error,
        additionalInfo: {
          state_id: jwtPayload.state_id,
          query: req.query,
          jwtPayload: jwtPayload,
          redirectUrl: redirectUrl,
          errType: errType
        }
      });
      logErrorEvent(req, errType, error);
    } finally {
      redirectURIFromCookie && res.cookie('SSO_REDIRECT_URI', '', { expires: new Date(0) });
      res.redirect(redirectUrl || errorUrl);
    }
  };
}

 




// Usage:
// app.get('/v2/user/session/create', initializeRoute());
// app.get('/v1/sso/contact/verified', handleVerifiedContactRoute());
// app.get('/v1/sso/success/redirect', handleSuccessRedirect());

// Export the function if needed
module.exports = {
  handleVerifiedContactRoute,
  handleSuccessRedirect,
  initializeRoute
};



 
 
