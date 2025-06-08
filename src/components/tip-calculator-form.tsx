"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Percent, Users, Calculator, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { tipCalculatorSchema, type TipCalculatorFormValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = "tipSplit_customTipPercentages_v1";

const DEFAULT_TIP_PERCENTAGES = [10, 15, 18, 20, 25];

interface TipOption {
  value: string;
  label: string;
}

interface CalculationResult {
  tipAmount: string;
  totalBill: string;
  perPersonAmount: string;
}

const ResultDisplayItem: React.FC<{ label: string; value: string; isEmphasized?: boolean }> = ({ label, value, isEmphasized }) => (
  <div className={cn("flex justify-between items-center py-2", isEmphasized && "mt-2 pt-3 border-t")}>
    <p className={cn("text-sm", isEmphasized && "font-semibold text-lg")}>{label}</p>
    <p className={cn("font-medium", isEmphasized && "font-bold text-xl text-primary")}>{value}</p>
  </div>
);


export function TipCalculatorForm() {
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [tipOptions, setTipOptions] = useState<TipOption[]>(
    DEFAULT_TIP_PERCENTAGES.map(tip => ({ value: String(tip), label: `${tip}%` }))
  );
  const [customTipInput, setCustomTipInput] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<TipCalculatorFormValues>({
    resolver: zodResolver(tipCalculatorSchema),
    defaultValues: {
      billAmount: undefined, // Use undefined for react-hook-form to treat as empty
      tipPercentage: 15,
      numberOfPeople: 1,
      roundShare: false,
    },
  });

  useEffect(() => {
    try {
      const storedCustomTipsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedCustomTipsRaw) {
        const storedCustomTips: number[] = JSON.parse(storedCustomTipsRaw);
        const customOptions = storedCustomTips
          .sort((a, b) => a - b)
          .map(tip => ({ value: String(tip), label: `${tip}%` }));
        
        // Combine and remove duplicates, preferring default if value is the same
        const allTipValues = new Set([...DEFAULT_TIP_PERCENTAGES.map(String), ...storedCustomTips.map(String)]);
        const combinedSortedOptions = Array.from(allTipValues)
          .map(Number)
          .sort((a,b) => a - b)
          .map(tip => ({ value: String(tip), label: `${tip}%`}));

        setTipOptions(combinedSortedOptions);
      }
    } catch (error) {
      console.error("Failed to load custom tips from localStorage:", error);
      toast({
        title: "Error",
        description: "Could not load saved custom tip percentages.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleAddCustomTip = () => {
    const newTip = parseFloat(customTipInput);
    if (isNaN(newTip) || newTip < 0 || newTip > 100) {
      toast({
        title: "Invalid Tip",
        description: "Please enter a valid tip percentage between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    if (tipOptions.some(option => option.value === String(newTip))) {
       toast({
        title: "Duplicate Tip",
        description: `${newTip}% is already in your list.`,
        variant: "default",
      });
      setCustomTipInput("");
      return;
    }

    const newTipOption = { value: String(newTip), label: `${newTip}%` };
    const updatedTipOptions = [...tipOptions, newTipOption].sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
    setTipOptions(updatedTipOptions);

    const currentCustomTips = tipOptions
        .filter(opt => !DEFAULT_TIP_PERCENTAGES.includes(Number(opt.value)))
        .map(opt => Number(opt.value));
    
    const newCustomTipsToStore = Array.from(new Set([...currentCustomTips, newTip])).sort((a,b) => a-b);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCustomTipsToStore));
      toast({
        title: "Success!",
        description: `Added ${newTip}% to your custom tips.`,
      });
      setCustomTipInput("");
      form.setValue("tipPercentage", newTip); // Optionally select the newly added tip
    } catch (error) {
      console.error("Failed to save custom tips to localStorage:", error);
      toast({
        title: "Error",
        description: "Could not save custom tip percentage.",
        variant: "destructive",
      });
      // Revert optimistic update if save fails
      setTipOptions(tipOptions);
    }
  };
  
  const handleRemoveCustomTip = (tipValueToRemove: string) => {
    if (DEFAULT_TIP_PERCENTAGES.includes(Number(tipValueToRemove))) {
      toast({ title: "Cannot Remove", description: "Default tip percentages cannot be removed.", variant: "default" });
      return;
    }
    const updatedTipOptions = tipOptions.filter(option => option.value !== tipValueToRemove);
    setTipOptions(updatedTipOptions);

    const customTipsToStore = updatedTipOptions
      .filter(opt => !DEFAULT_TIP_PERCENTAGES.includes(Number(opt.value)))
      .map(opt => Number(opt.value))
      .sort((a,b) => a-b);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customTipsToStore));
      toast({ title: "Removed", description: `Removed ${tipValueToRemove}% from your custom tips.` });
      if (String(form.getValues("tipPercentage")) === tipValueToRemove) {
        form.setValue("tipPercentage", DEFAULT_TIP_PERCENTAGES[1]); // Reset to 15% or another default
      }
    } catch (error) {
      console.error("Failed to update custom tips in localStorage:", error);
      toast({ title: "Error", description: "Could not update saved custom tips.", variant: "destructive" });
      setTipOptions(tipOptions); // Revert
    }
  };


  const onSubmit = (data: TipCalculatorFormValues) => {
    const bill = data.billAmount;
    const tipPercent = data.tipPercentage / 100;
    const people = data.numberOfPeople;

    const tipAmount = bill * tipPercent;
    const totalBill = bill + tipAmount;
    let perPersonAmount = totalBill / people;

    if (data.roundShare) {
      perPersonAmount = Math.round(perPersonAmount);
    }
    
    const formatCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    setResults({
      tipAmount: formatCurrency(tipAmount),
      totalBill: formatCurrency(totalBill),
      perPersonAmount: formatCurrency(perPersonAmount),
    });
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl bg-card rounded-xl overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center space-x-3">
          <Calculator size={36} />
          <div>
            <CardTitle className="text-3xl font-headline">TipSplit</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-sm">Quickly calculate tips and split bills.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="billAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Bill Amount</FormLabel>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} className="pl-10 text-base h-12" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Tip Percentage</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseFloat(value))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger className="text-base h-12">
                         <div className="flex items-center">
                            <Percent className="mr-2 h-5 w-5 text-muted-foreground" />
                            <SelectValue placeholder="Select tip %" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-base">
                          <div className="flex justify-between items-center w-full">
                            {option.label}
                            {!DEFAULT_TIP_PERCENTAGES.includes(Number(option.value)) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleRemoveCustomTip(option.value); }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <Label htmlFor="customTip" className="text-base">Add Custom Tip (%)</Label>
              <div className="flex space-x-2">
                <Input
                  id="customTip"
                  type="number"
                  placeholder="e.g. 12.5"
                  value={customTipInput}
                  onChange={(e) => setCustomTipInput(e.target.value)}
                  className="text-base h-12"
                />
                <Button type="button" onClick={handleAddCustomTip} variant="secondary" className="h-12">
                  <PlusCircle size={20} className="mr-2"/> Add
                </Button>
              </div>
            </div>


            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Number of People</FormLabel>
                   <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} min="1" step="1" className="pl-10 text-base h-12" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roundShare"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-secondary/30">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Round Each Share?</FormLabel>
                    <CardDescription>Round each person's share to the nearest dollar.</CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full text-lg h-14 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
              Calculate Tip
            </Button>
          </form>
        </Form>

        {results && (
          <div className="mt-8 animate-fade-in-slide-up">
            <Separator className="my-6" />
            <h2 className="text-2xl font-headline font-semibold mb-4 text-center text-primary">Calculation Results</h2>
            <div className="space-y-1 p-4 border rounded-lg shadow-sm bg-secondary/20">
              <ResultDisplayItem label="Tip Amount" value={results.tipAmount} />
              <ResultDisplayItem label="Total Bill" value={results.totalBill} />
              <ResultDisplayItem label="Amount Per Person" value={results.perPersonAmount} isEmphasized />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 text-center text-muted-foreground text-xs">
        TipSplit &copy; {new Date().getFullYear()}
      </CardFooter>
    </Card>
  );
}
