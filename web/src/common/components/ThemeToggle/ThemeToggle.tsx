import { Check, Moon, Sun, SunMoon } from 'lucide-react';
import { THEME_OPTIONS, ThemeUtil } from '@application/theme/themeUtils';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useTheme } from '@hooks/useTheme';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Theme" />}>
        <Sun className="dark:hidden" aria-hidden="true" />
        <Moon className="hidden dark:block" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {THEME_OPTIONS.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => setTheme(option.value)}>
              {option.value === ThemeUtil.SYSTEM ? <SunMoon aria-hidden="true" /> : null}
              {option.label}
              {option.value === theme ? <Check className="ml-auto" aria-hidden="true" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
