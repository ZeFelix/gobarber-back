import * as Yup from 'yup';

import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });

    await schema.validate(req.body).catch((sch) => {
      res.status(400).json({ message: sch.message });
    });

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ message: 'Email already exists!' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    return res.json({ id, name, email, provider });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string().min(6)
        .when('oldPassword', (oldPassword, field) => {
          return oldPassword ? field.required() : field;
        }),
      confirmPassword: Yup.string().when('password', (password, field) => {
        return password ? field.required().oneOf([Yup.ref('password')]) : field;
      }),
    });

    await schema.validate(req.body).catch((sch) => {
      res.status(400).json({ message: sch.message });
    });

    const { email, oldPassword } = req.body;
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(400).json({ message: `User not exists! id: ${id}` });
    }

    if (email != user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists!' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(400).json({ message: 'Password does not match!' });
    }
    
    const { name, provider } = await User.update(req.body);

    return res.json({ id, name, email, provider });
  }
}

export default new UserController();
