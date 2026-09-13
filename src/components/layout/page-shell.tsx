export function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="bg-navy-950 py-12 text-white">
        <div className="container-x max-w-3xl">
          <p className="eyebrow !text-flame-300">Legal</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
        </div>
      </section>
      <section className="section bg-white">
        <div className="container-x max-w-3xl space-y-5">{children}</div>
      </section>
    </>
  );
}
