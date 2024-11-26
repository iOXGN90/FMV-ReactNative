import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import Login from './src/screen/Login';
import Home from './src/screen/Home';
import OnGoingDeliveries from './src/screen/components/OnGoingDeliveries';
import Report from './src/screen/Report';
import './global.css'; // Tailwind global styles for NativeWind

import { Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

const Stack = createStackNavigator();

export default function App() {
  // State to manage the initial route of the app
  const [initialRoute, setInitialRoute] = useState<string>('Login'); // Set Login as the initial route
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  // Display a loading spinner until fonts and initial route are loaded
  if (!fontsLoaded || initialRoute === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="OnGoingDeliveries" component={OnGoingDeliveries} />
        <Stack.Screen name="Report" component={Report} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
