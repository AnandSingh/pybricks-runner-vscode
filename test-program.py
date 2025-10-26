"""
Simple test program for Pybricks SPIKE Prime
This file is used to test the extension functionality
"""
from pybricks.hubs import PrimeHub
from pybricks.parameters import Color
from pybricks.tools import wait

# Initialize the hub
hub = PrimeHub()

# Show startup pattern
hub.light.on(Color.GREEN)
wait(500)
hub.light.on(Color.BLUE)
wait(500)
hub.light.on(Color.RED)
wait(500)

# Success beep
hub.speaker.beep()

print("Test program executed successfully!")
hub.light.on(Color.WHITE)
