import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CountryForm from "@/components/CountryForm";
import type { Country } from "@/app/actions/countries";

export default async function EditCountryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("countries")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: "#f5f0e8" }}>
        Edit Country
      </h1>
      <CountryForm country={data as Country} />
    </div>
  );
}
