function SectionHeading({ eyebrow, title, description, align = "center" }) {
  return (
    <div className={align === "left" ? "max-w-2xl" : "mx-auto max-w-3xl text-center"}>
      {eyebrow && (
        <p className="mb-3 inline-flex rounded-full bg-saffron/15 border border-saffron/25 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-saffron-text">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base sm:text-lg text-slate-brand leading-relaxed">{description}</p>
      )}
    </div>
  );
}

export default SectionHeading;
