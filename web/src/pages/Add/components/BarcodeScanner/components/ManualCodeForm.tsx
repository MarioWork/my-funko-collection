import { Keyboard } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { normaliseBarcode } from '@utils/barcodeUtils';
import { reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  onSubmitCode: (barcode: string) => void;
};

const BARCODE_INPUT_ID = 'manual-barcode';

// Typing the code instead of scanning it, always one tap away.
function ManualCodeForm({ onSubmitCode }: Props) {
  const [manualCode, setManualCode] = useState('');
  const isCodeEmpty = manualCode.trim().length === 0;

  const submitManual = (event: FormEvent) => {
    event.preventDefault();

    const code = normaliseBarcode(manualCode);

    if (code.length > 0) onSubmitCode(code);
  };

  return (
    <form onSubmit={submitManual} className="flex items-end gap-2" noValidate>
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={BARCODE_INPUT_ID} className="text-sm font-medium">
          Or type the code
        </label>
        <Input
          id={BARCODE_INPUT_ID}
          inputMode="numeric"
          autoComplete="off"
          placeholder="889698…"
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
        />
      </div>
      <DisabledReason reason={reasonWhen(isCodeEmpty, 'Type the barcode first.')}>
        <Button type="submit" variant="outline" disabled={isCodeEmpty}>
          <Keyboard data-icon="inline-start" aria-hidden="true" />
          Use code
        </Button>
      </DisabledReason>
    </form>
  );
}

export default ManualCodeForm;
