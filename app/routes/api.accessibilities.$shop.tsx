import type { LoaderFunctionArgs } from "react-router";
import prisma from "~/db.server";
import { parseJson } from "~/utils/json.utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { shop } = params;

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const accessibility = await prisma.accessibilities.findFirst({
      where: {
        shop: shop,
        status: 1, // Only return enabled widgets
        deleted_at: null,
      },
      select: {
        status: true,
        icon: true,
        position: true,
        options: true,
        statement: true,
      },
    });

    if (!accessibility) {
      return new Response(JSON.stringify({ data: null }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse options JSON using utility
    const data = {
      status: accessibility.status,
      icon: accessibility.icon,
      position: accessibility.position,
      options: parseJson(accessibility.options as string, {}),
      statement: accessibility.statement,
    };

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Public API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
