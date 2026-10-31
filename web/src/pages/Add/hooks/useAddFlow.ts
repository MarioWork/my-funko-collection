import { useState } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil } from '@app-types/utility';
import funkoService from '@services/funkoService/funkoService';
import { type AddDestination } from '@utils/addDestinationUtils';
import { createFormData } from '@utils/formDataUtils';
import { NOT_FOUND_STATUS } from '@utils/httpStatusUtils';
import { prepareUpload } from '@utils/pendingPhotoUtils';
import type { AddActionData } from '../addActions';
import type { AddFunkoSubmission } from '../components/AddFunkoForm/types';
import { AddIntentUtil, AddStepUtil, ScanResultKindUtil, type ScanResult } from '../addUtils';

type Options = {
  isManual: boolean;
  destination: AddDestination;
  rememberDestination: (destination: AddDestination) => void;
  rememberCategory: (categoryId: string) => void;
};

type LookupState = { isLookingUp: boolean; result: ScanResult | null };

const MULTIPART = 'multipart/form-data';

// The add flow's steps and writes. The page only renders what this hands back.
export function useAddFlow({ isManual, destination, rememberDestination, rememberCategory }: Options) {
  const fetcher = useFetcher<AddActionData>();
  const [step, setStep] = useState<AddStepUtil>(isManual ? AddStepUtil.FORM : AddStepUtil.SCAN);
  const [lookup, setLookup] = useState<LookupState>({ isLookingUp: false, result: null });
  // A new key gives a fresh, empty form ("Add another", or a new box scanned).
  const [formKey, setFormKey] = useState(0);
  const [formBarcode, setFormBarcode] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [lastSettled, setLastSettled] = useState<AddActionData | undefined>(undefined);

  // A settled, successful write moves to the saved card. Derived during render, keyed on the data object.
  if (fetcher.state === 'idle' && fetcher.data && fetcher.data !== lastSettled) {
    setLastSettled(fetcher.data);
    if (fetcher.data.success) setStep(AddStepUtil.SAVED);
  }

  const openForm = (barcode: string) => {
    setFormBarcode(barcode);
    setFormKey((key) => key + 1);
    setStep(AddStepUtil.FORM);
  };

  const scanAnother = () => {
    setLookup({ isLookingUp: false, result: null });
    setStep(AddStepUtil.SCAN);
  };

  const addAnother = () => openForm('');

  // The scanner's hit: find by barcode, then show the matching card. The one read outside a loader, because it
  // depends on a camera frame rather than on the URL.
  const handleDetected = async (barcode: string) => {
    if (lookup.isLookingUp) return;

    setLookup({ isLookingUp: true, result: null });

    try {
      const funko = await funkoService.getFunkoByBarcode(barcode);

      setLookup({ isLookingUp: false, result: { kind: ScanResultKindUtil.FOUND, barcode, funko } });
      setStep(AddStepUtil.FOUND);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;

      if (status !== NOT_FOUND_STATUS) throw error;

      setLookup({ isLookingUp: false, result: { kind: ScanResultKindUtil.NOT_FOUND, barcode } });
      openForm(barcode);
    }
  };

  // One request: the funko, its item in each chosen collection, and the photos (resized on the device first).
  // The collections and the first item's tags are remembered as the starting point for the next funko.
  const submitCreate = async ({ funko, items, photos }: AddFunkoSubmission) => {
    rememberCategory(String(funko.categoryId));
    rememberDestination({
      collectionIds: items.map((item) => item.collectionId),
      tagIds: items[0]?.tagIds ?? [],
    });
    setIsPreparing(true);

    const body = await prepareUpload(photos);
    const fields = createFormData({ intent: AddIntentUtil.CREATE, funko, items });

    setIsPreparing(false);
    fields.forEach((value, key) => body.append(key, value));

    await fetcher.submit(body, { method: HttpVerbsUtil.POST, encType: MULTIPART });
  };

  const submitIncrement = (funkoId: number) => {
    if (destination.collectionIds.length === 0) return;

    void fetcher.submit(createFormData({ intent: AddIntentUtil.INCREMENT, funkoId, destination }), {
      method: HttpVerbsUtil.POST,
    });
  };

  return {
    step,
    lookup,
    formKey,
    formBarcode,
    isSubmitting: isPreparing || fetcher.state !== 'idle',
    failure: fetcher.data?.success === false ? fetcher.data.error : undefined,
    saved: lastSettled?.success ? lastSettled.data : undefined,
    scanAnother,
    addAnother,
    handleDetected,
    submitCreate,
    submitIncrement,
  };
}
