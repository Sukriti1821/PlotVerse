function SectionHeading({ eyebrow, title, description, align = "center" }) {
  return (
    <div className={align === "left" ? "max-w-2xl" : "mx-auto max-w-3xl text-center"}>
      {eyebrow && (
        <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-slate-600">{description}</p>
      )}
    </div>
  );
}

export default SectionHeading;
