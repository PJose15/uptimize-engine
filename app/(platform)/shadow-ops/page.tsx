import type { Metadata } from 'next';
import { ScanEye } from 'lucide-react';
import {
    PageHeading,
    Panel,
    PanelBody,
    PanelHeader,
    Pill,
    StatTile,
    TableShell,
    TD,
    TH,
    TR,
} from '@/components/platform/ui';
import { cn } from '@/lib/utils';
import { currency, money } from '@/lib/platform/format';
import { getCommandCenterData } from '@/lib/platform/data';
import type { ShadowOp, Tone } from '@/lib/platform/types';

export const metadata: Metadata = {
    title: 'Shadow Ops — UPTIMAIZE',
};

const STATUS_TONE: Record<ShadowOp['status'], Tone> = {
    detected: 'red',
    automating: 'gold',
    eliminated: 'green',
};

const STATUS_LABEL: Record<ShadowOp['status'], string> = {
    detected: 'Detected',
    automating: 'Automating',
    eliminated: 'Eliminated',
};

export default function ShadowOpsPage() {
    const { shadowOps } = getCommandCenterData();

    const hours = shadowOps.reduce((sum, op) => sum + op.hoursPerMonth, 0);
    const cost = shadowOps.reduce((sum, op) => sum + op.costPerMonth, 0);
    const eliminated = shadowOps.filter((op) => op.status === 'eliminated').length;

    return (
        <>
            <PageHeading
                title="Shadow Ops"
                subtitle="Hidden manual work the fleet has surfaced behind the official process."
            />

            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Processes Found" value={String(shadowOps.length)} tone="pink" hint="Across 6 partners" />
                <StatTile label="Hours / Month" value={String(hours)} tone="gold" hint="Manual effort identified" />
                <StatTile label="Cost / Month" value={currency(cost)} tone="red" hint={`${money(cost * 12)} annualized`} />
                <StatTile label="Eliminated" value={String(eliminated)} tone="green" hint="Replaced by automation" />
            </div>

            <Panel>
                <PanelHeader title="Detected Shadow Operations" />
                <PanelBody className="px-1">
                    <TableShell>
                        <thead>
                            <tr>
                                <th className={TH}>Process</th>
                                <th className={TH}>Partner</th>
                                <th className={TH}>System</th>
                                <th className={cn(TH, 'text-right')}>Hours / Mo</th>
                                <th className={cn(TH, 'text-right')}>Cost / Mo</th>
                                <th className={cn(TH, 'text-right')}>Annual Impact</th>
                                <th className={TH}>Status</th>
                                <th className={cn(TH, 'text-right')}>Detected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shadowOps.map((op) => (
                                <tr key={op.id} className={TR}>
                                    <td className={TD}>
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-up-pink/12 text-up-pink">
                                                <ScanEye className="h-4 w-4" />
                                            </span>
                                            <span className="font-medium text-up-text">{op.name}</span>
                                        </div>
                                    </td>
                                    <td className={cn(TD, 'text-up-dim')}>{op.partner}</td>
                                    <td className={cn(TD, 'text-up-faint')}>{op.system}</td>
                                    <td className={cn(TD, 'up-num text-right')}>{op.hoursPerMonth}</td>
                                    <td className={cn(TD, 'up-num text-right')}>
                                        {currency(op.costPerMonth)}
                                    </td>
                                    <td className={cn(TD, 'up-num text-right font-medium')}>
                                        {money(op.costPerMonth * 12)}
                                    </td>
                                    <td className={TD}>
                                        <Pill tone={STATUS_TONE[op.status]}>
                                            {STATUS_LABEL[op.status]}
                                        </Pill>
                                    </td>
                                    <td className={cn(TD, 'text-right text-up-faint')}>
                                        {op.detectedOn}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </TableShell>
                </PanelBody>
            </Panel>
        </>
    );
}
