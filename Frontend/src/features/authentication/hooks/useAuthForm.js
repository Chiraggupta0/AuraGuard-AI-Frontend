import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export default function useAuthForm(schema, defaultValues) {
  return useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });
}
