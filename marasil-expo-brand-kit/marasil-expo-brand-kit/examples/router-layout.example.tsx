// Reference only. Merge into the existing layout; keep auth, providers and navigation.
// Use this simple version when no custom resource loading is needed.
import { Stack } from 'expo-router';
export default function RootLayout() {
 return <Stack />;
}
// The native splash hides automatically. Do not add an artificial delay.
// If you already use preventAutoHideAsync(), keep the matching hideAsync()
// when local essential resources are ready, including an error/finally path.
