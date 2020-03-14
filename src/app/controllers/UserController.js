import User from '../models/User';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ message: 'Email already exists!' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    return res.json({ id, name, email, provider });
  }

  async update(req, res) {
    const { email, oldPassword } = req.body;
    const id = req.params.id;
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

    if (oldPassword && !await (user.checkPassword(oldPassword))) {
      return res.status(400).json({ message: 'Password does not match!' });
    }
    
    const { name, provider } = await User.update(req.body);

    return res.json({ id, name, email, provider });
  }
}

export default new UserController();
