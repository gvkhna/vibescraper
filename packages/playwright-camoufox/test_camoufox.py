#!/usr/bin/env python3
import asyncio
from camoufox.sync_api import Camoufox
from browserforge import BrowserForge
import yaml
import psutil
import os

def test_headful():
    """Test Camoufox in headful mode for local development"""
    
    # Show memory usage
    process = psutil.Process(os.getpid())
    print(f"Memory usage: {process.memory_info().rss / 1024 / 1024:.2f} MB")
    
    # Generate realistic browser fingerprint
    forge = BrowserForge()
    fingerprint = forge.fingerprint(
        browser="firefox",
        os="macos"
    )
    
    print("Generated fingerprint:")
    print(yaml.dump(fingerprint, default_flow_style=False))
    
    # Launch Camoufox in headful mode for testing
    with Camoufox(
        headless=False,  # Headful for local testing
        geoip=True,      # Use GeoIP features
        fingerprint=fingerprint
    ) as browser:
        page = browser.new_page()
        
        # Test navigation
        page.goto("https://browserleaks.com/canvas")
        print(f"Page title: {page.title()}")
        
        # Keep browser open for manual inspection
        input("Press Enter to close browser...")
        
        page.close()
    
    print("Test completed successfully!")

def test_headless():
    """Test Camoufox in headless mode (for Docker/CI)"""
    
    forge = BrowserForge()
    fingerprint = forge.fingerprint(
        browser="firefox",
        os="linux"  # Use Linux for headless/Docker
    )
    
    with Camoufox(
        headless=True,
        geoip=True,
        fingerprint=fingerprint
    ) as browser:
        page = browser.new_page()
        page.goto("https://httpbin.org/headers")
        
        # Get page content
        content = page.content()
        print(f"Response length: {len(content)} bytes")
        
        page.close()
    
    print("Headless test completed!")

if __name__ == "__main__":
    import sys
    
    mode = sys.argv[1] if len(sys.argv) > 1 else "headful"
    
    if mode == "headless":
        print("Running in headless mode...")
        test_headless()
    else:
        print("Running in headful mode...")
        test_headful()