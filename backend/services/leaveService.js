const leaveRepository = require('../repositories/leaveRepository');
const employeeRepository = require('../repositories/employeeRepository');
const userRepository = require('../repositories/userRepository');
const mailer = require('../utils/mailer');

class LeaveService {
  async getLeaveBalances(userId) {
    return leaveRepository.getBalancesByUserId(userId);
  }

  async getLeaveApplications(filters) {
    return leaveRepository.getApplications(filters);
  }

  async applyLeave(userId, applicationData) {
    const application = await leaveRepository.createApplicationTx({
      userId,
      leaveTypeId: applicationData.leaveTypeId,
      startDate: applicationData.startDate,
      endDate: applicationData.endDate,
      reason: applicationData.reason,
    });

    // Send email notification to HR / Admin (or Manager if configured)
    try {
      const employeeProfile = await employeeRepository.getProfileByUserId(userId);
      const leaveTypes = await leaveRepository.getLeaveTypes();
      const leaveType = leaveTypes.find(lt => lt.id === applicationData.leaveTypeId);

      await mailer.sendMail({
        to: 'hr@hrms.com', // HR group or designated manager
        subject: `New Leave Request - ${employeeProfile.first_name} ${employeeProfile.last_name}`,
        text: `${employeeProfile.first_name} has applied for ${leaveType ? leaveType.name : 'leave'} from ${applicationData.startDate} to ${applicationData.endDate}.\nReason: ${applicationData.reason}`,
        html: `<p><strong>${employeeProfile.first_name} ${employeeProfile.last_name}</strong> has applied for <strong>${leaveType ? leaveType.name : 'leave'}</strong>.</p>
               <p><strong>Dates:</strong> ${applicationData.startDate} to ${applicationData.endDate}</p>
               <p><strong>Reason:</strong> ${applicationData.reason}</p>
               <p>Please log in to the portal to review and approve/reject this request.</p>`
      });
    } catch (err) {
      console.error('Failed to send leave application email notification:', err.message);
    }

    return application;
  }

  async processLeaveApplication(applicationId, approverId, processData) {
    const application = await leaveRepository.processApplicationTx(
      applicationId,
      approverId,
      {
        action: processData.action,
        comments: processData.comments,
      }
    );

    // Send email notification to the applicant
    try {
      const applicantUser = await userRepository.findById(application.user_id);
      const applicantProfile = await employeeRepository.getProfileByUserId(application.user_id);
      const approverProfile = await employeeRepository.getProfileByUserId(approverId);

      await mailer.sendMail({
        to: applicantUser.email,
        subject: `Leave Request Update - ${processData.action}`,
        text: `Hello ${applicantProfile.first_name},\n\nYour leave request has been ${processData.action.toLowerCase()} by ${approverProfile.first_name} ${approverProfile.last_name}.\nComments: ${processData.comments || 'No comments'}.\n\nBest regards,\nHR Team`,
        html: `<p>Hello <strong>${applicantProfile.first_name}</strong>,</p>
               <p>Your leave request has been <strong>${processData.action.toLowerCase()}</strong> by ${approverProfile.first_name} ${approverProfile.last_name}.</p>
               <p><strong>Comments:</strong> ${processData.comments || 'No comments'}</p>
               <p>Best regards,<br/>HR Team</p>`
      });
    } catch (err) {
      console.error('Failed to send leave processing email notification:', err.message);
    }

    return application;
  }

  async getLeaveTypes() {
    return leaveRepository.getLeaveTypes();
  }
}

module.exports = new LeaveService();
