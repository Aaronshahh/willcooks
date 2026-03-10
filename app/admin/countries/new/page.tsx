import CountryForm from "@/components/CountryForm";

export default function NewCountryPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: "#f5f0e8" }}>
        Add Country
      </h1>
      <CountryForm />
    </div>
  );
}
