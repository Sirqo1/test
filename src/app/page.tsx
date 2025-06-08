import { TipCalculatorForm } from "@/components/tip-calculator-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <TipCalculatorForm />
    </main>
  );
}
