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
    desc: "Untouched open alpine meadows & pine glades in Solang & Manali.",
  },
  {
    name: "Date Night Setups",
    categoryId: "Date Night Setup",
    icon: GiHearts,
    desc: "Fairy-lit open ridges, candlelit bonfires & stargazing.",
  },
  {
    name: "Hillside Huts",
    categoryId: "Hillside Hut",
    icon: GiWoodCabin,
    desc: "Rustic timber & stone chalets amidst apple orchards.",
  },
  {
    name: "Get Together Setups",
    categoryId: "Get Together Setup",
    icon: GiBarbecue,
    desc: "Open gathering lawns, barbecue pits & acoustic campfire circles.",
  },
  {
    name: "Mountain Cafes",
    categoryId: "Mountain Cafe",
    icon: GiCoffeeCup,
    desc: "Open-air courtyards, herbal chai & sunset view terraces.",
  },
  {
    name: "Riverside Meadows",
    categoryId: "Riverside Meadow",
    icon: GiRiver,
    desc: "Raw riverbank clearing plots beside Parvati & Tirthan rivers.",
  },
  {
    name: "Empty Plots",
    categoryId: "Empty Plot",
    icon: GiMountainRoad,
    desc: "Private terraced land for camping, yoga & creative work.",
  },
  {
    name: "Campfire Stays",
    categoryId: "Campfire Stays",
    icon: GiCampfire,
    desc: "Wilderness pine clearings with dedicated firepits & logs.",
  },
];

function Categories() {
  return (
    <section className="bg-mist/30 border-t border-mist px-6 py-20">
      <div className="mx-auto max-w-6xl">
        {/* Section intro */}
        <div className="mb-10 text-center">
          <p className="mb-3 inline-block rounded-full bg-saffron/15 border border-saffron/25 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-saffron-text">
            Explore the outdoors
          </p>
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Browse by Category
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base sm:text-lg text-slate-brand">
            Find the perfect scenic plot tailored to your outdoor experience.
          </p>
        </div>

        {/* Category cards grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ name, categoryId, icon: Icon, desc }) => (
            <Link
              key={name}
              to={`/listings?category=${encodeURIComponent(categoryId)}`}
              className="group flex flex-col justify-between rounded-3xl border border-mist bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-saffron/40"
            >
              <div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-saffron shadow-sm group-hover:scale-105 transition">
                  <Icon className="text-2xl" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-navy group-hover:text-saffron-text transition-colors">
                  {name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-brand leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-navy group-hover:text-saffron-text transition-colors">
                <span>Explore plots</span>
                <FaArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
