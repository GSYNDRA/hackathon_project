const { SuiClient } = require('@mysten/sui/client');
const config = require('../config');

class SuiService {
  constructor() {
    this.client = new SuiClient({ url: config.sui.rpcUrl });
    this.packageId = config.sui.packageId;
    this.platformObjectId = config.sui.platformObjectId;
  }

  async getObject(objectId) {
    try {
      const object = await this.client.getObject({
        id: objectId,
        options: { showContent: true, showType: true },
      });
      return object;
    } catch (error) {
      console.error('Failed to get object:', error.message);
      return null;
    }
  }

  async _getPlatformFields() {
    if (!this.platformObjectId) {
      console.warn('SUI_PLATFORM_OBJECT_ID not configured');
      return null;
    }

    const platform = await this.getObject(this.platformObjectId);
    if (!platform || !platform.data || !platform.data.content) {
      console.error('Failed to fetch Platform object from chain');
      return null;
    }

    return platform.data.content.fields;
  }

  async isTeacherOnChain(address) {
    const fields = await this._getPlatformFields();
    if (!fields || !fields.teachers) {
      return false;
    }

    const teacherSet = fields.teachers.fields;
    const contents = teacherSet.contents || [];
    return contents.some(item => item.fields && item.fields.key === address);
  }

  async isStudentOnChain(address) {
    const fields = await this._getPlatformFields();
    if (!fields || !fields.students) {
      return false;
    }

    const studentSet = fields.students.fields;
    const contents = studentSet.contents || [];
    return contents.some(item => item.fields && item.fields.key === address);
  }

  async getOnChainRole(address) {
    const isTeacher = await this.isTeacherOnChain(address);
    if (isTeacher) return 'teacher';

    const isStudent = await this.isStudentOnChain(address);
    if (isStudent) return 'student';

    return null;
  }

  async verifyRegistrationTx(txDigest, expectedRole, expectedAddress) {
    try {
      const txDetails = await this.client.getTransactionBlock({
        digest: txDigest,
        options: { showEvents: true, showInput: true },
      });

      if (!txDetails || !txDetails.events) {
        return { valid: false, reason: 'Transaction not found or has no events' };
      }

      const eventName = expectedRole === 'teacher'
        ? 'TeacherRegistered'
        : 'StudentRegistered';

      const matchingEvent = txDetails.events.find(event =>
        event.type && event.type.includes(eventName)
      );

      if (!matchingEvent) {
        return { valid: false, reason: `No ${eventName} event found in transaction` };
      }

      const eventData = matchingEvent.parsedJson || {};
      const eventAddress = eventData.teacher || eventData.student || '';

      if (expectedAddress && eventAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
        return { valid: false, reason: 'Event address does not match expected address' };
      }

      const txSender = txDetails.transaction?.data?.sender || '';
      if (expectedAddress && txSender.toLowerCase() !== expectedAddress.toLowerCase()) {
        return { valid: false, reason: 'Transaction sender does not match expected address' };
      }

      return { valid: true, event: matchingEvent };
    } catch (error) {
      console.error('Failed to verify transaction:', error.message);
      return { valid: false, reason: `Verification error: ${error.message}` };
    }
  }
}

module.exports = new SuiService();