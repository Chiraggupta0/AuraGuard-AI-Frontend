import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema } from '../validation/auth.validation';

export default function useAuthForm(defaultValues) {
  return useForm({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });
}
