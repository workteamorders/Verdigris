'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Checkbox, Radio, SelectField, Slider, Stepper, Switch, TextField } from './Field';
import { Dialog } from './Dialog';
import { useToast } from './Toast';
import { Disc } from './Disc';
import { Banner } from './Banner';
import { DataTable } from './DataTable';
import { LEVEL_NAMES, mainnetThresholdsSeconds, DAY_SECONDS, patinaLevel } from '@/lib/patina';
import styles from '@/app/styleguide/Styleguide.module.css';

const validateAddress = (v: string): string | undefined => (/^0x[0-9a-fA-F]{40}$/.test(v) ? undefined : 'Enter a 42-character address that starts with 0x.');

export function FormDemo() {
  const [amount, setAmount] = useState(1);
  const [days, setDays] = useState(45);
  const level = patinaLevel(days * DAY_SECONDS, mainnetThresholdsSeconds);
  return (
    <div className={styles.formGrid}>
      <TextField label="Recipient address" hint="Paste the full address. Sending a Disc resets its Patina to Level 0." placeholder="0x…" validate={validateAddress} />
      <TextField label="Recipient address" hint="Pinned hover state." placeholder="0x…" forceState="hover" />
      <TextField label="Recipient address" hint="Pinned focus state." placeholder="0x…" forceState="focus" />
      <TextField label="Recipient address" defaultValue="0x12" error="Enter a 42-character address that starts with 0x." />
      <TextField label="Recipient address" hint="Disabled: wallet not connected." placeholder="0x…" disabled />
      <Stepper label="Amount" hint="1 to 2 Discs per Day, per wallet." min={1} max={2} value={amount} onChange={setAmount} />
      <SelectField
        label="Tier"
        hint="Filters the Gallery."
        options={[
          { value: 'all', label: 'All tiers' },
          { value: 'ordinary', label: 'Ordinary' },
          { value: 'fine', label: 'Fine' },
          { value: 'crown', label: 'Crown' },
        ]}
      />
      <div>
        <Checkbox label="I have read the Risk notice" hint="Shown once, before the first mint." />
        <Checkbox label="Checked and disabled" defaultChecked disabled />
      </div>
      <fieldset className={styles.fieldset}>
        <legend>Sort Discs by</legend>
        <Radio name="sort" label="Day" defaultChecked />
        <Radio name="sort" label="Patina level" />
        <Radio name="sort" label="Last moved" disabled />
      </fieldset>
      <div>
        <Switch label="Show Patina dates in my local time" />
        <Switch label="Reduce motion (follows your system)" defaultChecked />
      </div>
      <Slider label="Patina time-lapse" hint="Move the slider to age one Disc. This is the same rule the contract uses." valueText={`${days} days without a move: Level ${level} (${LEVEL_NAMES[level]})`} min={0} max={150} value={days} onChange={(e) => setDays(Number(e.currentTarget.value))} />
      <div className={styles.scrubDisc}>
        <Disc sign={6} numeral={3} level={level} />
      </div>
    </div>
  );
}

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.row}>
      <Button variant="danger" icon="send" onClick={() => setOpen(true)}>
        Send Disc #31
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Send Disc #31?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Keep Disc
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Send Disc #31
            </Button>
          </>
        }
      >
        <p>This sends the Disc to another wallet. Its Patina returns to Level 0 on arrival. A transfer cannot be undone.</p>
      </Dialog>
    </div>
  );
}

export function ToastDemo() {
  const toast = useToast();
  return (
    <div className={styles.row}>
      <Button variant="secondary" onClick={() => toast({ tone: 'success', title: 'Disc minted', line: 'Disc #31 is yours. Transaction confirmed.' })}>
        Show success toast
      </Button>
      <Button variant="secondary" onClick={() => toast({ tone: 'danger', title: 'Transaction not sent', line: 'The simulation failed. No funds left your wallet.' })}>
        Show error toast
      </Button>
      <Button variant="secondary" onClick={() => toast({ tone: 'info', title: 'Next serial changed', line: 'Another mint landed first. Check the Disc before you sign.' })}>
        Show info toast
      </Button>
    </div>
  );
}

export function BannerDemo() {
  return (
    <div className={styles.stack}>
      <Banner tone="warning" title="TEST CLOCK.">
        One Day lasts 15 minutes on this deployment. Nothing here follows the 24-hour schedule.
      </Banner>
      <Banner tone="info" title="View-only.">
        Minting and sending are unavailable from your region. The contract itself stays permissionless.
      </Banner>
      <Banner tone="danger" title="Wrong network.">
        Your wallet is on another chain. Switch network to mint.
      </Banner>
      <Banner tone="info" title="No external audit yet.">
        Read the Rules and the Risk notice before you mint.
      </Banner>
    </div>
  );
}

interface DemoRow {
  id: number;
  day: number;
  sign: string;
  numeral: number;
  tier: string;
  level: number;
  price: string;
}

const DEMO_ROWS: readonly DemoRow[] = [
  { id: 31, day: 31, sign: 'Slashes', numeral: 3, tier: 'Ordinary', level: 0, price: '0.020' },
  { id: 12, day: 12, sign: 'Squares', numeral: 6, tier: 'Fine', level: 3, price: '0.040' },
  { id: 57, day: 57, sign: 'Crescent', numeral: 1, tier: 'Ordinary', level: 1, price: '0.020' },
  { id: 8, day: 8, sign: 'Grid', numeral: 7, tier: 'Crown', level: 4, price: '0.080' },
];

export function TableDemo() {
  return (
    <DataTable<DemoRow>
      caption="Disc preview data"
      rowKey={(r) => String(r.id)}
      rows={DEMO_ROWS}
      columns={[
        { key: 'id', header: 'Disc', numeric: true, sortable: true, cell: (r) => `#${r.id}`, sortValue: (r) => r.id },
        { key: 'day', header: 'Day', numeric: true, sortable: true, cell: (r) => r.day, sortValue: (r) => r.day },
        { key: 'sign', header: 'Sign', sortable: true, cell: (r) => r.sign, sortValue: (r) => r.sign },
        { key: 'numeral', header: 'Numeral', numeric: true, cell: (r) => r.numeral },
        { key: 'tier', header: 'Tier', cell: (r) => r.tier },
        { key: 'level', header: 'Patina', numeric: true, sortable: true, cell: (r) => `Level ${r.level}`, sortValue: (r) => r.level },
        { key: 'price', header: 'Mint price (ETH)', numeric: true, cell: (r) => r.price },
      ]}
    />
  );
}
