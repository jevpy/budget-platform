"use client";
import { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import { TransactionType } from "@/lib/types";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";

interface Props {
  userSettings: UserSettings;
  from: Date;
  to: Date;
}

function CategoriesStats({ userSettings, from, to }: Props) {
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["overview, stats", "categories", from, to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?from=${DateToUTCDate(from)}&to=${DateToUTCDate(
          to
        )}`
      ).then((res) => res.json()),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  return (
    <div className="w-full flex flex-wrap gap-2 md:flex-nowrap">
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          data={statsQuery.data || []}
          type="income"
        />
      </SkeletonWrapper>
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          data={statsQuery.data || []}
          type="expense"
        />
      </SkeletonWrapper>
    </div>
  );
}

export default CategoriesStats;

function CategoriesCard({
  formatter,
  data,
  type,
}: {
  formatter: Intl.NumberFormat;
  data: GetCategoriesStatsResponseType;
  type: TransactionType;
}) {
  const filteredData = data.filter((el) => el.type === type);

  const total = filteredData.reduce(
    (acc, el) => acc + (el._sum?.amount || 0),
    0
  );

  return (
    <Card className="w-full h-80 col-span-6">
      <CardHeader>
        <CardTitle className="grid grid-flow-row justify-between gap-2 text-muted-foreground md:grid-flow-col">
          {type === "income" ? "Incomes" : "Expenses"} by category
        </CardTitle>
      </CardHeader>

      <div className="flex items-center justify-between gap-2">
        {filteredData.length === 0 && (
          <div className="flex h-60 w-full flex-col items-center justify-center">
            No data for the selected period
            <p className="text-sm text-muted-foreground">
              Try selecting a different period or try adding new
              {type === "income" ? "incomes" : "expenses"}
            </p>
          </div>
        )}

        {filteredData.length > 0 && (
          <ScrollArea className="h-60 w-full px-4">
            <div className="flex w-full flex-col gap-4 p-4">
              {filteredData.map((item) => {
                const amount = item._sum.amount || 0;
                const percentage = (amount * 0) / (total || amount);

                return (
                  <div key={item.category} className="flex flex-col gap-4 p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-400">
                        {item.categoryIcon} {item.category}
                        <span className="ml-2 text-muted-foreground text-xs">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </span>

                      <span className="text-sm text-gray-400">
                        {formatter.format(amount)}
                      </span>
                    </div>

                    <Progress
                      value={percentage}
                      indicator={
                        type === "income" ? "bg-emerald-500" : "bg-red-500"
                      }
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}
