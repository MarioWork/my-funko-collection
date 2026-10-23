import type { LucideIcon } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import type { NamedApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import IconButton from '@components/IconButton';
import { Button } from '@components/ui/button';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { Spinner } from '@components/ui/spinner';
import { useCreateNamed } from '@hooks/useCreateNamed';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  // "category", "series": in the button's name and the field label.
  noun: string;
  actionPath: string;
  // The icon of this kind of thing, as in the sidebar: Book, Library.
  icon: LucideIcon;
  onCreated: (created: NamedApiModel) => void;
};

const NAME_MAX_LENGTH = 100;
const TYPE_NAME_REASON = 'Type a name first.';

// A "+" beside a dropdown: name a new one, Create, and it is saved and picked without leaving the form. Not a
// nested form (that would submit the outer one): Enter in the field creates instead.
function CreateNamedButton({ noun, actionPath, icon: Icon, onCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const inputId = `create-${noun}-name`;
  const errorId = `${inputId}-error`;
  const { create, isCreating, errorMessage } = useCreateNamed({
    actionPath,
    onCreated: (created) => {
      onCreated(created);
      setName('');
      setIsOpen(false);
    },
  });
  const trimmedName = name.trim();
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= NAME_MAX_LENGTH;

  const submit = () => {
    if (isNameValid) create(trimmedName);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    submit();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={<IconButton aria-label={`New ${noun}`} variant="outline" className="border-input bg-card" />}
      >
        <Icon aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <Field data-invalid={errorMessage ? true : undefined}>
          <FieldLabel htmlFor={inputId}>New {noun}</FieldLabel>
          <Input
            id={inputId}
            value={name}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? errorId : undefined}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          {errorMessage ? <FieldError id={errorId}>{errorMessage}</FieldError> : null}
        </Field>
        <DisabledReason reason={isCreating ? DISABLED_REASONS.SAVING : reasonWhen(!isNameValid, TYPE_NAME_REASON)}>
          <Button type="button" onClick={submit} disabled={!isNameValid || isCreating} className="self-end">
            {isCreating ? <Spinner data-icon="inline-start" /> : <Icon data-icon="inline-start" aria-hidden="true" />}
            Create
          </Button>
        </DisabledReason>
      </PopoverContent>
    </Popover>
  );
}

export default CreateNamedButton;
