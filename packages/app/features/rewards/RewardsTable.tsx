import React from 'react';

import { Separator } from 'app/ui/layout/Separator';
import { H2, P, Text } from 'app/ui/typography';

type RewardsTableProps = {
  values: Record<number, string>;
  emptyText: string;
  totalValue: string;
};

export const RewardsTable: React.FC<RewardsTableProps> = ({
  values,
  emptyText,
  totalValue,
}) => {
  const rows = Object.entries(values);

  if (rows.length === 0) {
    return <P className={'text-blackA-9 font-semibold italic'}>{emptyText}</P>;
  }

  return (
    <table className="w-full table-auto">
      <tbody>
        {rows.map((week) => (
          <tr key={week[0]}>
            <th className="whitespace-nowrap p-4  text-left">
              <P className={'font-semibold'}>Distribution {week[0]}</P>
            </th>
            <td className="whitespace-nowrap p-4 text-right">
              <P className={'font-mono '}>{week[1]} ROBOT</P>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2}>
            <Separator className={'w-[100%]'} />
          </td>
        </tr>
        <tr>
          <th className="p-4 text-left">
            <H2>Total</H2>
          </th>
          <td className="p-4 text-right">
            <H2 className={'font-mono '}>{totalValue} ROBOT</H2>
          </td>
        </tr>
      </tfoot>
    </table>
  );
};
