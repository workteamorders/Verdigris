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
import { CalendarGrid } from './CalendarGrid';
import { CountClock } from './CountClock';
import { MintedTotal } from './MintedTotal';
import { Panel } from './Panel';
import { PatinaTimeline } from './PatinaTimeline';
import { RackArtwork } from './Artwork';
import { Reveal } from './Reveal';
import { TiltDisc } from './TiltDisc';
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
      caption="Example Discs, EXAMPLE data"
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

export function MotionDemos() {
  const [selected, setSelected] = useState(0);
  const [total, setTotal] = useState(24);
  const [calendarMode, setCalendarMode] = useState('live');
  return (
    <>
      <p className="label">EXAMPLE</p>
      <h3>Patina timeline</h3>
      <p>Use the arrow keys or drag the slider to preview each threshold.</p>
      <PatinaTimeline />
      <PatinaTimeline disabled />

      <h3>Disc tilt and sheen</h3>
      <div className={styles.wheelGrid}>
        {(['ready', 'disabled', 'loading', 'empty', 'error'] as const).map((state) => (
          <figure key={state} className={styles.wheelCell}>
            {state === 'ready'
              ? <a href="#motion" aria-label="Focus the Disc card"><TiltDisc state={state} sign={5} numeral={3} level={2} noFilters /></a>
              : <TiltDisc state={state} sign={5} numeral={3} level={2} noFilters />}
            <figcaption className="label">{state}</figcaption>
          </figure>
        ))}
      </div>

      <h3>Count clock</h3>
      <dl>
        <dt>Next Day</dt><dd><CountClock seconds={27_311} /></dd>
        <dt>Day boundary</dt><dd><CountClock seconds={0} /></dd>
        {(['loading', 'empty', 'error', 'disabled'] as const).map((state) => (
          <div key={state}><dt>{state}</dt><dd><CountClock state={state} /></dd></div>
        ))}
      </dl>

      <h3>Calendar</h3>
      <SelectField
        label="Calendar state"
        value={calendarMode}
        onChange={(event) => setCalendarMode(event.currentTarget.value)}
        options={[
          { value: 'live', label: 'Live Day' },
          { value: 'loading', label: 'Loading' },
          { value: 'empty', label: 'No live Day' },
          { value: 'error', label: 'Error' },
          { value: 'disabled', label: 'Disabled' },
        ]}
      />
      {calendarMode === 'loading' && <p role="status">Reading the Count…</p>}
      {calendarMode === 'error' && <p role="status">The chain could not be read.</p>}
      <CalendarGrid today={calendarMode === 'live' ? 6 : null} selected={selected} onSelect={setSelected} disabled={calendarMode === 'disabled'} />

      <h3>Scroll reveal and minted total</h3>
      <Reveal>
        <Panel>
          <p><MintedTotal value={total} /> Discs minted</p>
          <Button onClick={() => setTotal((value) => value === 24 ? 72 : 24)}>Change total</Button>
        </Panel>
        <Panel><RackArtwork kind="missing" /></Panel>
        <Panel><RackArtwork kind="offline" /></Panel>
      </Reveal>
    </>
  );
}
