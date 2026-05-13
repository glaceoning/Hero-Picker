@extends('layouts.home')
@section('content')
    <main class="my-8">
        <section class="mx-auto max-w-7xl rounded-lg bg-[#294452] p-4 shadow-lg sm:p-6">
            <h1 class="fjalla text-4xl uppercase text-amber-400 sm:text-5xl">Overwatch Hero Performance by Map</h1>
            <div class="mt-4 grid gap-4 text-lg text-slate-100 lg:grid-cols-3">
                <p class="lg:col-span-2">
                    This page shows how each Overwatch hero performs on each competitive map. Select a map to see heroes
                    ranked by their overall map score, with objective-point breakdowns that highlight where each hero is
                    strongest.
                </p>
                <div class="rounded-md bg-[#1C2E37] p-4 text-sm">
                    <h2 class="fjalla text-xl uppercase text-white">How scoring works</h2>
                    <p class="mt-2">Scores use a -20 to +20 scale: +20 is excellent, +10 is good, 0 is neutral, -10 is poor, and -20 is avoid.</p>
                </div>
            </div>
        </section>

        <section class="mx-auto mt-6 max-w-7xl rounded-lg bg-[#243b47] p-4 sm:p-6">
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <label class="grid gap-2 text-lg uppercase">
                    <span class="fjalla text-amber-400">Map</span>
                    <select id="map-select" class="rounded-md bg-[#1C2E37] p-3 text-white">
                        @foreach ($map_list as $type => $maps)
                            <optgroup label="{{ $type }}">
                                @foreach ($maps as $mapName)
                                    <option value="{{ $mapName }}">{{ $mapName }}</option>
                                @endforeach
                            </optgroup>
                        @endforeach
                    </select>
                </label>
                <div class="flex flex-wrap gap-2" aria-label="Role filters">
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase ring-2 ring-amber-400" data-role="All">All</button>
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase" data-role="Tank">Tank</button>
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase" data-role="Damage">Damage</button>
                    <button type="button" class="role-filter rounded-md bg-[#1C2E37] px-4 py-2 uppercase" data-role="Support">Support</button>
                </div>
            </div>

            <div class="mt-6 overflow-x-auto rounded-lg border border-slate-600">
                <table class="w-full min-w-[720px] border-collapse text-left" id="maps-table">
                    <thead class="bg-[#1C2E37] text-amber-400">
                        <tr id="maps-table-head">
                            <th class="p-3">Hero</th>
                            <th class="p-3 text-center">Overall</th>
                        </tr>
                    </thead>
                    <tbody id="maps-table-body"></tbody>
                </table>
            </div>
        </section>
    </main>

    <script>
        const mapData = @json($processed_data);
        const heroes = @json($heroes_ordered);
        const heroImages = @json($hero_images);
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

        function renderMap() {
            const mapName = document.getElementById('map-select').value;
            const selectedMap = mapData[mapName];
            const head = document.getElementById('maps-table-head');
            const body = document.getElementById('maps-table-body');

            head.innerHTML = '<th class="p-3">Hero</th><th class="p-3 text-center">Overall</th>';
            selectedMap.columns.forEach((column) => {
                const label = column.dual ? `${column.pointName}<br><span class="text-xs">ATK / DEF</span>` : column.pointName;
                head.insertAdjacentHTML('beforeend', `<th class="p-3 text-center">${label}</th>`);
            });

            const rows = heroes
                .filter((hero) => activeRole === 'All' || hero.role === activeRole)
                .filter((hero) => selectedMap.heroes[hero.name])
                .sort((a, b) => selectedMap.heroes[b.name].overall - selectedMap.heroes[a.name].overall);

            body.innerHTML = rows.map((hero) => {
                const heroData = selectedMap.heroes[hero.name];
                const image = heroImages[hero.name] || 'images/assets/blank-hero.webp';
                const pointCells = selectedMap.columns.map((column) => {
                    const scores = heroData.points[column.pointName] || {};
                    if (column.dual) {
                        const atk = scores.attack ?? 0;
                        const def = scores.defense ?? 0;
                        return `<td class="p-2 text-center"><span class="inline-block min-w-10 rounded ${scoreClass(atk)} px-2 py-1">${atk}</span> <span class="inline-block min-w-10 rounded ${scoreClass(def)} px-2 py-1">${def}</span></td>`;
                    }
                    const score = scores.score ?? 0;
                    return `<td class="p-2 text-center"><span class="inline-block min-w-10 rounded ${scoreClass(score)} px-2 py-1">${score}</span></td>`;
                }).join('');

                return `<tr class="border-t border-slate-600 odd:bg-[#294452]" data-role="${hero.role}">
                    <td class="p-3"><div class="flex items-center gap-3"><img class="h-12 w-12 rounded-full object-cover" src="${image}" alt="${hero.name}"><div><strong>${hero.name}</strong><div class="text-sm text-slate-300">${hero.role}</div></div></div></td>
                    <td class="p-2 text-center"><span class="inline-block min-w-10 rounded ${scoreClass(heroData.overall)} px-2 py-1">${heroData.overall}</span></td>
                    ${pointCells}
                </tr>`;
            }).join('');
        }

        document.getElementById('map-select').addEventListener('change', renderMap);
        document.querySelectorAll('.role-filter').forEach((button) => {
            button.addEventListener('click', () => {
                activeRole = button.dataset.role;
                document.querySelectorAll('.role-filter').forEach((item) => item.classList.remove('ring-2', 'ring-amber-400'));
                button.classList.add('ring-2', 'ring-amber-400');
                renderMap();
            });
        });
        renderMap();
    </script>
@endsection
