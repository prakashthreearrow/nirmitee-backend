const Response = require("../../services/Response");
const {
  INTERNAL_SERVER,
  SUCCESS,
  ROLE
} = require("../../services/Constants");
const { Appointment } = require("../../models");
const {
  addEditAppointmentValidation,
} = require("../../services/UserValidation");

module.exports = {
  /**
   * @description "This function is used to create an appointment."
   * @param req
   * @param res
   */
  createAppointment: async (req, res) => {
    try {
      const { authUserId } = req;
      const { title, date, startTime, endTime } = req.body;
      addEditAppointmentValidation(req.body, res, async (validate) => {
        if (validate) {
          let appointmentObj = {
            userId: authUserId,
            title: title,
            date: date,
            startTime: startTime,
            endTime: endTime,
          }
          let appointment = await Appointment.create(
            appointmentObj
          );

          return Response.successResponseData(
            res,
            appointment,
            SUCCESS,
            res.__("appoinementCreated")
          );
        }
      });
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },

  /**
 * @description "This function is used to update the appointment."
 * @param req
 * @param res
 */
  updateAppointment: async (req, res) => {
    try {
      const { title, date, startTime, endTime, id } = req.body;
      addEditAppointmentValidation(req.body, res, async (validate) => {
        if (validate) {
          let appointmentObj = {
            title: title,
            date: date,
            startTime: startTime,
            endTime: endTime,
          }

          await Appointment.updateOne(
            { _id: id },
            {
              $set: appointmentObj,
            }
          );

          return Response.successResponseWithoutData(
            res,
            res.locals.__("appoinementUpdated"),
            SUCCESS
          );
        }
      });
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },

  /**
* @description "This function is used to get the appointments."
* @param req
* @param res
*/
  getAppointments: async (req, res) => {
    try {
      const { authUserId, role } = req;
      
      // Base query
      let query = {};

      // Add userId dynamically if the role is 1
      if (role === ROLE.USER) {
        query = {
          ...query,
          userId: authUserId
        }
      }

      // Base find operation
      let appointment = null;

      // Add populate dynamically if the role is 2
      if (role === ROLE.DOCTOR) {
        appointment = await Appointment.find(query).populate({
          path: "userId", // Specify the field to populate
          select: "userName email", // Fields to select during population
        }).lean();
      } else {
        appointment = await Appointment.find(query).lean();;
      }

      return Response.successResponseData(
        res,
        appointment,
        SUCCESS,
        res.__("success")
      );
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },

};
