import { startOfHour, parseISO, isBefore, format, subHours} from 'date-fns';
import pt from 'date-fns/locale/pt';
import * as Yup from 'yup';

import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notifications';


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

    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      " 'dia' dd 'de' MMMM', às H:mm'h",
      { locale: pt },
    );

    await Notification.create({
      content: `Novo agendamento para ${user.name} para o ${formattedDate}`,
      user: provider_id,
    });
    
    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id);

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({ message: 'You don´t have permissions to cancel this appointment.' });
    }

    const dateWithSub = subHours((await appointment).getDataValue, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({ message: 'You can cancel appointment 2 hours in advance.' });
    }

    await appointment.update({ canceled_at: new Date() });
    return res.json(appointment);
  }
}

export default new AppoitmentController();
