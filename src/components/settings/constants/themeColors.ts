import { type ThemeColor } from '@/store/themeStore';

export const themeColors: Array<{ id: ThemeColor; name: string; preview: string }> = [
  { id: 'lime', name: 'Lime', preview: 'bg-[hsl(84,81%,44%)]' },
  { id: 'yellow', name: 'Yellow', preview: 'bg-[hsl(45,93%,47%)]' },
  { id: 'blue', name: 'Blue', preview: 'bg-[hsl(217,91%,60%)]' },
  { id: 'purple', name: 'Purple', preview: 'bg-[hsl(262,83%,58%)]' },
  { id: 'red', name: 'Red', preview: 'bg-[hsl(0,84%,60%)]' },
  { id: 'green', name: 'Green', preview: 'bg-[hsl(142,76%,36%)]' },
  { id: 'orange', name: 'Orange', preview: 'bg-[hsl(24,95%,53%)]' },
  { id: 'pink', name: 'Pink', preview: 'bg-[hsl(330,81%,60%)]' },
  { id: 'teal', name: 'Teal', preview: 'bg-[hsl(174,63%,41%)]' },
  { id: 'brown', name: 'Brown', preview: 'bg-[hsl(30,30%,40%)]' },
  { id: 'gray', name: 'Gray', preview: 'bg-[hsl(210,10%,60%)]' },
  { id: 'indigo', name: 'Indigo', preview: 'bg-[hsl(243,75%,59%)]' },
];
