import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import {
  GiCampfire,
  GiMountainRoad,
  GiWoodCabin,
  GiCoffeeCup,
  GiRiver,
  GiGrass,
  GiBarbecue,
  GiHearts,
} from "react-icons/gi";

const categories = [
  {
    name: "Grassland Plots",
    categoryId: "Grassland Plot",
    icon: GiGrass,
    accent: "from-emerald-500 to-green-400",
    desc: "Untouched open alpine meadows & pine glades in Solang & Manali.",
  },
  {
    name: "Date Night Setups",
    categoryId: "Date Night Setup",
    icon: GiHearts,
    accent: "from-rose-500 to-pink-400",
    desc: "Fairy-lit open ridges, candlelit bonfires & stargazing.",
  },
  {
    name: "Hillside Huts",
    categoryId: "Hillside Hut",
    icon: GiWoodCabin,
    accent: "from-amber-600 to-yellow-500",
    desc: "Rustic timber & stone chalets amidst apple orchards.",
  },
  {
    name: "Get Together Setups",
    categoryId: "Get Together Setup",
    icon: GiBarbecue,
    accent: "from-orange-500 to-amber-500",
    desc: "Open gathering lawns, barbecue pits & acoustic campfire circles.",
  },
  {
    name: "Mountain Cafes",
    categoryId: "Mountain Cafe",
    icon: GiCoffeeCup,
    accent: "from-teal-500 to-cyan-500",
    desc: "Open-air courtyards, herbal chai & sunset view terraces.",
  },
  {
    name: "Riverside Meadows",
    categoryId: "Riverside Meadow",
    icon: GiRiver,
    accent: "from-sky-500 to-blue-500",
    desc: "Raw riverbank clearing plots beside Parvati & Tirthan rivers.",
  },
  {
    name: "Empty Plots",
    categoryId: "Empty Plot",
    icon: GiMountainRoad,
    accent: "from-lime-500 to-emerald-500",
    desc: "Private terraced land for camping, yoga & creative work.",
  },
  {
    name: "Campfire Stays",
    categoryId: "Campfire Stays",
    icon: GiCampfire,
    accent: "from-purple-500 to-indigo-500",
    desc: "Wilderness pine clearings with dedicated firepits & logs.",
  },
];

function Categories() {
  return (
    <section className="bg-gradient-to-b from-emerald-50/70 to-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        {/* Section intro */}
        <div className="mb-10 text-center">
          <p className="mb-3 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
            Explore the outdoors
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Browse by Category
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            Find the perfect scenic spot based on your experience.
          </p>
        </div>

        {/* Category cards grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ name, categoryId, icon: Icon, accent, desc }) => (
            <Link
              key={name}
              to={`/listings?category=${encodeURIComponent(categoryId)}`}
              className="group flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-emerald-200"
            >
              <div>
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-sm group-hover:scale-105 transition`}
                >
                  <Icon className="text-2xl text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition">
                  {name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition">
                <span>View Escapes</span>
                <FaArrowRight
                  size={11}
                  className="transition transform group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
