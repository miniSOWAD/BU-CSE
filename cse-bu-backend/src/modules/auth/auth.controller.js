import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../users/user.model.js";

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email in use" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });
    res.status(201).json({ id: user._id, name, email, role });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });
    const token = sign(user);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("name role email");
  res.json({ user });
};
