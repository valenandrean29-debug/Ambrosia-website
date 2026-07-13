import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { supabase } from "../supabase";

export const searchProductsTool = tool(
  async ({ category, max_price, keyword }) => {
    console.log(`\n=> [System] Agent memanggil Supabase Database dengan filter:`, { category, max_price, keyword });

    let query = supabase.from("products").select("*");

    if (category) {
      query = query.eq("category", category);
    }
    
    if (max_price !== undefined) {
      query = query.lt("price", max_price);
    }
    
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,brand.ilike.%${keyword}%`);
    }

    const { data, error } = await query.limit(5);

    if (error) {
      console.log("Supabase error:", error.message);
      return `Error searching products: ${error.message}`;
    }

    if (!data || data.length === 0) {
      console.log("Supabase returned empty data.");
      return "No products found matching the criteria.";
    }

    console.log("Supabase returned:", data.length, "rows.");
    return JSON.stringify(data);
  },
  {
    name: "search_products",
    description: "Search for supplement products from the database based on category, maximum price, and keywords.",
    schema: z.object({
      category: z.enum(["whey", "creatine", "gainer"]).optional().describe("Category of supplement. Map protein/cutting to 'whey', mass/bulking to 'gainer', strength to 'creatine'."),
      max_price: z.number().optional().describe("The maximum price the user is willing to pay"),
      keyword: z.string().optional().describe("Keyword to match against product brand or description"),
    }),
  }
);
