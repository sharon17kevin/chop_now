1. I need help cleaning up my React Native marketplace app's architecture. 

Project location: c:\Resources\app\chow\mobile-app

I have a tasks.md file with 5 prioritized cleanup tasks:
1. Centralize Supabase Access (all DB calls through services layer)
2. Remove Duplicate Logic (DRY principle)
3. Remove Unused Files (clean up dead code)
4. Order Instruction Files (organize docs)
5. Enforce Separation of Concerns (clear layer boundaries)

Current problem: 59+ files import supabase directly instead of going through a service layer. The architecture should be: Component → Hook → Service → Supabase

Start with Task 1: Centralize Supabase Access
- Read tasks.md for full details
- Run the PowerShell command to find all supabase imports
- Begin migrating hooks to use services (OrderService, ProductService)
- Show me what you find before making large changes

The goal is a clean architecture where only files in services/ can import from '@/lib/supabase'.

Work step-by-step and ask for confirmation before major refactors.

