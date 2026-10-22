import { useState } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil } from '@app-types/utility';
import type { FunkoFormValues } from '@components/FunkoFormFields/funkoFormUtils';
import funkoService from '@services/funkoService/funkoService';
import type { CreateFunko } from '@services/funkoService/funkoService.type';
import { createFormData } from '@utils/formDataUtils';
import type { AddActionData } from '../addActions';
import { AddIntentUtil, AddStepUtil, type QuickAddValues, type ScanResult } from '../addUtils';
import { type AddDestination } from '@utils/addDestinationUtils';

type Options = {
  isManual: boolean;
  destination: AddDestination;
  rememberCategory: (categoryId: string) => void;
};

type LookupState = { isLookingUp: boolean; result: ScanResult | null };

const NOT_FOUND_STATUS = 404;

// The add flow's steps and writes. The page only renders what this hands back.
export function useAddFlow({ isManual, destination, rememberCategory }: Options) {
  const fetcher = useFetcher<AddActionData>();
  const [step, setStep] = useState<AddStepUtil>(isManual ? AddStepUtil.DETAILS : AddStepUtil.SCAN);
  const [lookup, setLookup] = useState<LookupState>({ isLookingUp: false, result: null });
  const [detailsValues, setDetailsValues] = useState<Partial<FunkoFormValues>>({});
  const [lastSettled, setLastSettled] = useState<AddActionData | undefined>(undefined);

  // A settled, successful write moves to the "added" card. Derived during render, keyed on the data object.
  if (fetcher.state === 'idle' && fetcher.data && fetcher.data !== lastSettled) {
    setLastSettled(fetcher.data);
    if (fetcher.data.success) setStep(AddStepUtil.ADDED);
  }

  const scanAgain = () => {
    setLookup({ isLookingUp: false, result: null });
    setStep(AddStepUtil.SCAN);
  };

  // The scanner's hit: find by barcode, then show the matching card. The one read outside a loader, because it
  // depends on a camera frame rather than on the URL.
  const handleDetected = async (barcode: string) => {
    if (lookup.isLookingUp) return;

    setLookup({ isLookingUp: true, result: null });

    try {
      const funko = await funkoService.getFunkoByBarcode(barcode);

      setLookup({ isLookingUp: false, result: { kind: 'found', barcode, funko } });
      setStep(AddStepUtil.FOUND);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;

      if (status !== NOT_FOUND_STATUS) throw error;

      setLookup({ isLookingUp: false, result: { kind: 'not-found', barcode } });
      setStep(AddStepUtil.QUICK);
    }
  };

  const submitCreate = (funko: CreateFunko, quantity: number) => {
    rememberCategory(String(funko.categoryId));
    void fetcher.submit(createFormData({ intent: AddIntentUtil.CREATE, funko, quantity, destination }), {
      method: HttpVerbsUtil.POST,
    });
  };

  const submitIncrement = (funkoId: number) => {
    if (destination.collectionId === null) return;

    void fetcher.submit(
      createFormData({ intent: AddIntentUtil.INCREMENT, funkoId, collectionId: destination.collectionId }),
      { method: HttpVerbsUtil.POST },
    );
  };

  const openDetails = (values: Partial<QuickAddValues> = {}) => {
    setDetailsValues({
      name: values.name,
      number: values.number,
      type: values.type,
      categoryId: values.categoryId,
      barcode: values.barcode ?? '',
    });
    setStep(AddStepUtil.DETAILS);
  };

  return {
    step,
    lookup,
    detailsValues,
    isSubmitting: fetcher.state !== 'idle',
    failure: fetcher.data?.success === false ? fetcher.data.error : undefined,
    addedFunko: lastSettled?.success ? lastSettled.data?.funko : undefined,
    scanAgain,
    handleDetected,
    submitCreate,
    submitIncrement,
    openDetails,
  };
}
