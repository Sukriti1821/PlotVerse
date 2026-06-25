import Navbar from "../components/common/Navbar";
import ListingCard from "../components/cards/ListingCard";

const dummyListings = [
  {
    id: 1,
    title: "Mountain View Camp",
    location: "Manali",
    area: "800 sq.ft",
    price: "₹25,00,000",
  },
  {
    id: 2,
    title: "Lake Side Tent",
    location: "Kashmir",
    area: "1200 sq.ft",
    price: "₹30,00,000",
  },
];

const Listings = () => {
  return (
    <>
      <Navbar />

      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {dummyListings.map((plot) => (
          <ListingCard key={plot.id} plot={plot} />
        ))}
      </div>
    </>
  );
};

export default Listings;
