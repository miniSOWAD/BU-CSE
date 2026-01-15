// scripts/seed-people.mjs
import "dotenv/config.js";
import mongoose from "mongoose";
import { Person } from "../src/modules/people/person.model.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bu-cse";

const people = [
  // ---- FACULTY ----
  {
    name: "Dr. Rahat Hossain Faisal",
    designation: "Associate Professor & Chairman",
    email: "faisal@bu.ac.bd",
    phone: "",
    photoUrl: "/chairman.jpg",
    bio: "Fuzzy Intelligent Systems, Computational Modeling",
    category: "faculty",
  },
  {
    name: "Dr. Md Manjur Ahmed",
    designation: "Associate Professor",
    email: "manjur@bu.ac.bd",
    phone: "",
    photoUrl: "/monjur.jpg",
    bio: "Data stream clustering and classification, Computational Intelligence and its application.",
    category: "faculty",
  },
  {
    name: "Md Erfan",
    designation: "Assistant Professor",
    email: "erfan@bu.ac.bd",
    phone: "",
    photoUrl: "/irfan.jpg",
    bio: "AI, Machine Learning (ML4SE)",
    category: "faculty",
  },
  {
    name: "Md Samsuddoha",
    designation: "Assistant Professor",
    email: "samsuddoha@bu.ac.bd",
    phone: "",
    photoUrl: "/sams.jpg",
    bio: "Software Engineering, Programming Languages, Machine Learning (ML4SE)",
    category: "faculty",
  },
  {
    name: "Dr. Tania Islam",
    designation: "Assistant Professor",
    email: "tania@bu.ac.bd",
    phone: "",
    photoUrl: "/tania.jpg",
    bio: "WSN, MAC protocols, Molecular & Underwater communication",
    category: "faculty",
  },

  {
    name: "Md Asif",
    designation: "Assistant Professor",
    email: "asif@bu.ac.bd",
    phone: "",
    photoUrl: "/asif.jpg",
    bio: "Data Processing, Data Communication",
    category: "faculty",
  },

  {
    name: "Md Mahbub E Noor",
    designation: "Assistant Professor",
    email: "noor@bu.ac.bd",
    phone: "",
    photoUrl: "/noor.jpg",
    bio: "Data Communication, Data Clustering",
    category: "faculty",
  },

  // ---- STAFF ----
  {
    name: "Farjana Yesmin",
    designation: "Section Officer",
    email: "farjana@bu.ac.bd",
    phone: "",
    photoUrl: "/farjana.jpg",
    bio: "Campus administration, coordination",
    category: "staff",
  },
  {
    name: "Abu Rayhan",
    designation: "Junior Instrument Engineer",
    email: "rayhan@bu.ac.bd",
    phone: "",
    photoUrl: "/rayhan.jpg",
    bio: "Hardware labs support and maintenance",
    category: "staff",
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Mongo connected");

  // Upsert by (name + category) so you can re-run safely
  for (const p of people) {
    await Person.findOneAndUpdate(
      { name: p.name, category: p.category },
      p,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Upserted: ${p.category.toUpperCase()} — ${p.name}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
