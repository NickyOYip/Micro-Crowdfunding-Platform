/**
 * @class UserProfile
 * @classdesc Represents the user profile data fetched from the User contract.
 * @param {Object} params - The parameters for the UserProfile.
 * @param {string} params.owner - Address of the user.
 * @param {Array} [params.certificatesList=[]] - Array of Certificate objects representing all certificates associated with the user.
 * @param {Array} [params.certifiedCertificates=[]] - Array of Certificate objects representing certified certificates.
 * @param {Array} [params.history=[]] - Array of History objects representing the history of events related to the user profile.
 */
export class UserProfile {
  constructor({
    owner,
    certificatesList = [],
    certifiedCertificates = [],
    history = [],
  }) {
    this.owner = owner;
    this.certificatesList = certificatesList.map(cert => new Certificate(cert));
    this.certifiedCertificates = certifiedCertificates.map(cert => new Certificate(cert));
    this.history = history.map(event => new History(event));
  }
}
  
/**
 * @class Certificate
 * @classdesc Represents the certificate data fetched from the Certificate contract.
 * @param {Object} params - The parameters for the Certificate.
 * @param {string} params.owner - Address of the contract owner.
 * @param {string} params.userAddress - Address of the user linked to the certificate.
 * @param {string} params.data - Encrypted certificate data.
 * @param {string} params.documentHash - Hash of the certified document.
 * @param {string} params.jsonHash - Hash of the JSON certificate.
 * @param {string} params.certificateName - Name of the certificate.
 * @param {string} params.orgName - Name of the issuing organization.
 * @param {string} params.activeCode - Activation code for the certificate.
 * @param {number} params.activeTime - Timestamp indicating the activation time limit.
 * @param {number} params.disableTime - Timestamp indicating when the certificate should be disabled.
 * @param {number} params.deployTime - Timestamp indicating when the certificate was deployed.
 * @param {string} params.state - Enum representing the current state of the certificate (Inactive, Active, Disabled).
 * @param {Array} [params.history=[]] - Array of History objects representing the history of events related to the certificate.
 */
export class Certificate {
    constructor({
      owner,
      userAddress,
      data,
      documentHash,
      jsonHash,
      certificateName,
      orgName,
      activeCode,
      activeTime,
      disableTime,
      deployTime,
      state,
      history = [],
    }) {
      this.owner = owner;
      this.userAddress = userAddress;
      this.data = data;
      this.documentHash = documentHash;
      this.jsonHash = jsonHash;
      this.certificateName = certificateName;
      this.orgName = orgName;
      this.activeCode = activeCode;
      this.activeTime = activeTime;
      this.disableTime = disableTime;
      this.deployTime = deployTime;
      this.state = state;
      this.history = history.map(event => new History(event));
    }
  }


/**
 * @class History
 * @classdesc Represents the history of events related to user profiles and certificates.
 * @param {Object} params - The parameters for the History.
 * @param {string} params.event - Name of the event (e.g., `UserRegistered`, `CertificateActivated`, `StateUpdated`).
 * @param {number} params.timestamp - Timestamp of the event.
 * @param {string} params.details - Additional details about the event.
 */
export class History {
    constructor({ event, timestamp, details }) {
      this.event = event;
      this.timestamp = timestamp;
      this.details = details;
    }
  }

  