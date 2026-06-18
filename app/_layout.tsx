import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '타이머',
          tabBarIcon: ({ color }) => <Ionicons name="timer-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stopwatch"
        options={{
          title: '스톱워치',
          tabBarIcon: ({ color }) => <Ionicons name="stopwatch-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="interval"
        options={{
          title: '인터벌',
          tabBarIcon: ({ color }) => <Ionicons name="fitness-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alarm"
        options={{
          title: '알람',
          tabBarIcon: ({ color }) => <Ionicons name="alarm-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
