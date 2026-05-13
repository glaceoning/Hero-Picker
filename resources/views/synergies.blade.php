@extends('layouts.home')
@section('content')
    <main class="my-8">
        <section class="mx-auto max-w-7xl rounded-lg bg-[#294452] p-4 shadow-lg sm:p-6">
            <h1 class="fjalla text-4xl uppercase text-amber-400 sm:text-5xl">Overwatch Hero Synergies</h1>
            <p class="mt-4 max-w-4xl text-lg text-slate-100">Select your hero to find the best hero combinations and teammates, ranked from strongest to weakest synergy. Use the role filters to narrow down results by Tank, Damage, or Support.</p>
            <div class="mt-4 rounded-md bg-[#1C2E37] p-4 text-sm text-slate-100">
                <strong>How the scoring system works:</strong> +20 means Excellent Synergy, +10 is favorable, 0 is neutral, -10 is unfavorable, and -20 means Poor Synergy.
            </div>
        </section>

        <section class="mx-auto mt-6 max-w-7xl rounded-lg bg-[#243b47] p-4 sm:p-6">
            <h2 class="fjalla text-2xl uppercase text-amber-400">Select Your Hero</h2>
            <div class="mt-4 grid max-h-96 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                @foreach ($heroes as $hero)
                    @php
                        $heroImage = $hero_images[$hero['name']] ?? 'images/assets/blank-hero.webp';
                        $role = $hero_roles[$hero['name']] ?? 'Unknown';
                    @endphp
                    <button type="button" class="hero-select rounded-lg bg-[#1C2E37] p-2 text-left transition hover:bg-[#35576a]" data-hero="{{ $hero['name'] }}" data-role="{{ $role }}">
                        <img class="mx-auto h-20 w-20 rounded-full object-cover" src="{{ asset($heroImage) }}" alt="{{ $hero['name'] }}">
                        <span class="mt-2 block text-center font-bold">{{ $hero['name'] }}</span>
                        <span class="block text-center text-xs text-slate-300">{{ $role }}</span>
                    </button>
                @endforeach
            </div>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
                <h2 class="fjalla text-2xl uppercase text-white"><span id="selected-hero-label"></span> Synergy Results</h2>
                <div class="flex flex-wrap gap-2" aria-label="Role filters">
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase ring-2 ring-amber-400" data-role="All">All</button>
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase" data-role="Tank">Tank</button>
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase" data-role="Damage">Damage</button>
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase" data-role="Support">Support</button>
                    <button type="button" id="reset-selection" class="rounded-md bg-amber-500 px-4 py-2 uppercase text-slate-950">Reset</button>
                </div>
            </div>

            <div class="mt-4 overflow-hidden rounded-lg border border-slate-600">
                <table class="w-full text-left">
                    <thead class="bg-[#1C2E37] text-amber-400">
                        <tr>
                            <th class="p-3">Teammate</th>
                            <th class="p-3 text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody id="results-body"></tbody>
                </table>
            </div>
        </section>
    </main>

    <script>
        const heroes = @json($heroes);
        const heroRoles = @json($hero_roles);
        const heroImages = @json($hero_images);
        const matrix = @json($synergies);
        let selectedHero = heroes[0]?.name || '';
        let activeRole = 'All';

        function scoreClass(score) {
            if (score >= 20) return 'bg-green-600 text-white';
            if (score >= 10) return 'bg-green-400 text-slate-950';
            if (score > 0) return 'bg-green-200 text-slate-950';
            if (score === 0) return 'bg-gray-300 text-slate-950';
            if (score >= -10) return 'bg-red-200 text-slate-950';
            if (score >= -20) return 'bg-red-400 text-white';
            return 'bg-red-600 text-white';
        }

        function renderResults() {
            document.getElementById('selected-hero-label').textContent = selectedHero;
            document.querySelectorAll('.hero-select').forEach((button) => {
                button.classList.toggle('ring-2', button.dataset.hero === selectedHero);
                button.classList.toggle('ring-amber-400', button.dataset.hero === selectedHero);
            });

            const rows = heroes
                .filter((hero) => hero.name !== selectedHero)
                .map((hero) => ({ ...hero, role: heroRoles[hero.name] || 'Unknown', score: matrix[selectedHero]?.[hero.name] ?? 0 }))
                .filter((hero) => activeRole === 'All' || hero.role === activeRole)
                .sort((a, b) => b.score - a.score);

            document.getElementById('results-body').innerHTML = rows.map((hero) => {
                const image = heroImages[hero.name] || 'images/assets/blank-hero.webp';
                return `<tr class="border-t border-slate-600 odd:bg-[#294452]">
                    <td class="p-3"><div class="flex items-center gap-3"><img class="h-12 w-12 rounded-full object-cover" src="${image}" alt="${hero.name}"><div><strong>${hero.name}</strong><div class="text-sm text-slate-300">${hero.role}</div></div></div></td>
                    <td class="p-3 text-center"><span class="inline-block min-w-12 rounded ${scoreClass(hero.score)} px-3 py-1">${hero.score}</span></td>
                </tr>`;
            }).join('');
        }

        document.querySelectorAll('.hero-select').forEach((button) => button.addEventListener('click', () => { selectedHero = button.dataset.hero; renderResults(); }));
        document.querySelectorAll('.role-filter').forEach((button) => button.addEventListener('click', () => {
            activeRole = button.dataset.role;
            document.querySelectorAll('.role-filter').forEach((item) => item.classList.remove('ring-2', 'ring-amber-400'));
            button.classList.add('ring-2', 'ring-amber-400');
            renderResults();
        }));
        document.getElementById('reset-selection').addEventListener('click', () => { selectedHero = heroes[0]?.name || ''; activeRole = 'All'; document.querySelector('.role-filter[data-role="All"]').click(); });
        renderResults();
    </script>
@endsection
