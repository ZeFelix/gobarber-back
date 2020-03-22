import { startOfHour, parseISO, isBefore} from 'date-fns';
import * as Yup from 'yup';

import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';


class AppoitmentController {
  async index(req, res) {
    const qtdPerPage = 20;
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: qtdPerPage,
      offset: (page - 1) * qtdPerPage, // paginação de 20 em 20
      include: {
        model: User,
        as: 'provider',
        attributes: ['id', 'name'],
        include: {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      },
    });

    return res.json({ appointments });
  }


  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    await schema.validate(req.body).catch((sch) => {
      return res.status(400).json({ message: sch.message });
    });

    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res.status(401).json({ message: 'You can only create appointments with providers' });
    }

    const hourStart = startOfHour(parseISO(date));
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (isBefore(hourStart, new Date()) || checkAvailability) {
      return res.status(400).json({ message: 'Past dates are not premitted.' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });
    
    return res.json(appointment);
  }
}

export default new AppoitmentController();
