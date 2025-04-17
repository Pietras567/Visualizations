import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import pandas as pd
import os
import kaleido
from plotly.subplots import make_subplots
import plotly.io as pio
import copy

kaleido.get_chrome_sync()

def float_to_time(hours):
    h = int(hours)
    m = int((hours - h) * 60)
    return f"{h:02d}:{m:02d}"

# Funkcja konwertująca czas w formacie "HH:MM" na liczbę godzin, w typie float
def time_to_float(t):
    h, m = map(int, t.split(':'))
    return h + m / 60

external_stylesheets = [
    {
        "href": "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Roboto+Slab:wght@400;700&display=swap",
        "rel": "stylesheet"
    }
]

# Wczytanie danych z pliku CSV
data = pd.read_csv("plan.csv")

# Wstępne czyszczenie danych
data.columns = [col.strip() for col in data.columns]
data["StartTime"] = data["StartTime"].str.strip()
data["EndTime"] = data["EndTime"].str.strip()
data["Category"] = data["Category"].str.strip()
data["Day"] = data["Day"].str.strip()

# Konwersja danych czasowych na liczby
data["StartFloat"] = data["StartTime"].apply(time_to_float)
data["EndFloat"] = data["EndTime"].apply(time_to_float)
data["Duration"] = data["EndFloat"] - data["StartFloat"]

# Ustalenie pozycji na osi Y dla dni tygodnia
day_order = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"]
day_order.reverse()
day_y = {day: i * 10 for i, day in enumerate(day_order)}
bar_height = 5

# Grupowanie danych do wykresu aktywności
categories = {}
for idx, row in data.iterrows():
    cat = row["Category"]
    if cat not in categories:
        categories[cat] = {"x": [], "width": [], "y": []}
    categories[cat]["x"].append(row["StartFloat"])
    categories[cat]["width"].append(row["Duration"])
    categories[cat]["y"].append(day_y.get(row["Day"], 0))

# Definicja kolorów dla kategorii
kolory = {
    "Sen": "darkblue",
    "Odpoczynek i rozrywka": "green",
    "Transport": "gray",
    "Studia": "orange",
    "Obowiązki": "saddlebrown",
    "Praca": "darkmagenta",
    "Siłownia": "red"
}

# Interaktywny słupkowy wykres aktywności
traces = []
for cat, data_cat in categories.items():
    trace = go.Bar(
        name=f'{cat}',
        x=data_cat["width"],
        y=data_cat["y"],
        base=data_cat["x"],
        orientation='h',
        width=bar_height,
        marker=dict(
            color=kolory.get(cat, "lightgray"),
            opacity=1
        ),
        customdata=[[float_to_time(x), float_to_time(x + w), float_to_time((x + w) - x)] for x, w in zip(data_cat["x"], data_cat["width"])],
        hovertemplate=(
            "Kategoria: " + cat +
            "<br>Start: %{customdata[0]}" +
            "<br>Koniec: %{customdata[1]}" +
            "<br>Czas trwania: %{customdata[2]}" +
            "<extra></extra>"
        )
    )
    traces.append(trace)

layout1 = go.Layout(
    title={
        "text": "Podział aktywności według dni tygodnia",
        "font": {
            "family": "Roboto Slab, serif",
            "size": 24,
            "color": "#000"
        }
    },
    xaxis=dict(
        title="Godzina",
        range=[0, 24],
        categoryorder='array',
        categoryarray=day_order,
        dtick=1,
        tickmode='linear'),
    yaxis=dict(
        title="Dzień tygodnia",
        tickvals=list(day_y.values()),
        ticktext=list(day_y.keys())
    ),
    clickmode='event+select',
    barmode='stack',
    font={
        "family": "Roboto, sans-serif",
        "size": 14,
        "color": "#333"
    }
)

fig1 = go.Figure(data=traces, layout=layout1)

# Wykres podsumowujący udział każdej kategorii w całym tygodniu
total_week_hours = 7 * 24
summary = data.groupby("Category")["Duration"].sum().reset_index()
summary["Percent"] = summary["Duration"] / total_week_hours * 100

trace_summary = go.Bar(
    x=summary["Category"],
    y=summary["Percent"],
    marker=dict(color=[kolory.get(cat, "lightgray") for cat in summary["Category"]]),
    text=[f"{p:.1f}%" for p in summary["Percent"]],
    textposition="auto"
)
layout_summary = go.Layout(
    title={
        "text": "Procentowy udział kategorii w całkowitym czasie tygodnia",
        "font": {
            "family": "Roboto Slab, serif",
            "size": 24,
            "color": "#000"
        }
    },
    yaxis=dict(title="Procent"),
    xaxis=dict(title="Kategoria"),
    font={
        "family": "Roboto, sans-serif",
        "size": 14,
        "color": "#333"
    }
)
fig2 = go.Figure(data=[trace_summary], layout=layout_summary)

day_order.reverse()
# 7 wykresów donut przedstawiających procentowy udział w czasie dnia
fig3 = make_subplots(rows=1, cols=7, specs=[[{'type': 'domain'}]*7],
                     subplot_titles=day_order)

for i, day in enumerate(day_order, start=1):
    day_data = data[data["Day"] == day]
    if day_data.empty:
        fig3.add_trace(go.Pie(
            labels=["Brak danych"],
            values=[1],
            hole=0.4,
            marker=dict(colors=["white"])
        ), row=1, col=i)
    else:
        group = day_data.groupby("Category")["Duration"].sum().reset_index()
        total_day = group["Duration"].sum()
        group["Percent"] = group["Duration"] / total_day * 100
        fig3.add_trace(go.Pie(
            labels=group["Category"],
            values=group["Percent"],
            hole=0.5,
            marker=dict(
                colors=[kolory.get(cat, "lightgray") for cat in group["Category"]],
                line=dict(color='#ffffff', width=2)
            ),
            textinfo="none",
            hovertemplate="Kategoria: %{label}<br>Udział: %{percent:.1%}<extra></extra>"
        ), row=1, col=i)

fig3.update_layout(
    title={
        "text": "Procentowy udział kategorii w czasie aktywności poszczególnych dni",
        "font": {
            "family": "Roboto Slab, serif",
            "size": 24,
            "color": "#000"
        }
    },
    font={
        "family": "Roboto, sans-serif",
        "size": 14,
        "color": "#333"
    }
)

# Układ z trzema wykresami
app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
app.layout = html.Div([
    html.Div([
        dcc.Graph(
            id='activity-graph',
            figure=fig1
        )
    ], style={'margin-bottom': '50px'}),
    html.Div([
        dcc.Graph(
            id='summary-graph',
            figure=fig2
        )
    ], style={'margin-bottom': '50px'}),
    html.Div([
        dcc.Graph(
            id='donut-graph',
            figure=fig3
        )
    ]),
    html.Div("Kliknij na słupek w wykresie aktywności, aby wyszarzyć pozostałe kategorie.")
])

# wyszarzanie nieklikniętych kategorii
@app.callback(
    Output('activity-graph', 'figure'),
    Input('activity-graph', 'clickData'),
    State('activity-graph', 'figure')
)
def highlight_category(clickData, current_fig):
    if clickData is None:
        for trace in current_fig['data']:
            trace['marker']['opacity'] = 1
        return current_fig

    clicked_cat = clickData['points'][0].get('customdata', None)
    if clicked_cat is None:
        return current_fig

    for trace in current_fig['data']:
        if trace.get('customdata', [None])[0] == clicked_cat:
            trace['marker']['opacity'] = 1
        else:
            trace['marker']['opacity'] = 0.2

    return current_fig

def export_images():
    print("Eksportuję obrazy...")
    print(os.getcwd())

    fig1.write_html("activity_graph.html")
    fig2.write_html("summary_graph.html")
    fig3.write_html("donut_graph.html")

    fig1.write_image("activity_graph.png")
    fig2.write_image("summary_graph.png")
    fig3.write_image("donut_graph.png")

    fig1.write_image("activity_graph.svg")
    fig2.write_image("summary_graph.svg")
    fig3.write_image("donut_graph.svg")

    print("Obrazy zapisane.")

def export_combined():
    print("Eksportuję końcowe obrazy...")

    fig = make_subplots(
        rows=3,
        cols=7,
        specs=[
            [{"colspan": 7}, None, None, None, None, None, None],
            [{"colspan": 7}, None, None, None, None, None, None],
            [{"type": "domain"}, {"type": "domain"}, {"type": "domain"},
             {"type": "domain"}, {"type": "domain"}, {"type": "domain"}, {"type": "domain"}]
        ],
        subplot_titles=["Podział aktywności według dni tygodnia", "Procentowy udział kategorii w całkowitym czasie tygodnia oraz z podziałem na dnie",
                        "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"],
        vertical_spacing=0.10,
        horizontal_spacing=0.01
    )

    for trace in fig1.data:
        new_trace = copy.deepcopy(trace)
        new_trace.showlegend = False
        fig.add_trace(new_trace, row=1, col=1)

    for trace in fig2.data:
        new_trace = copy.deepcopy(trace)
        new_trace.showlegend = False
        fig.add_trace(new_trace, row=2, col=1)

    if isinstance(fig3, list):
        for i, fig_donut in enumerate(fig3):
            if i < 7:
                for trace in fig_donut.data:
                    new_trace = copy.deepcopy(trace)
                    new_trace.showlegend = False
                    fig.add_trace(new_trace, row=3, col=i + 1)
    else:
        traces_per_day = len(fig3.data) // 7
        for i in range(7):
            start_idx = i * traces_per_day
            end_idx = (i + 1) * traces_per_day
            for j in range(start_idx, min(end_idx, len(fig3.data))):
                new_trace = copy.deepcopy(fig3.data[j])
                new_trace.showlegend = False
                fig.add_trace(new_trace, row=3, col=i + 1)

    try:
        colors = kolory
    except NameError:
        colors = {
            'Praca': '#1f77b4',
            'Nauka': '#ff7f0e',
            'Sport': '#2ca02c',
            'Rozrywka': '#d62728',
            'Odpoczynek': '#9467bd',
            'Inne': '#8c564b'
        }

    for cat in categories:
        fig.add_trace(
            go.Scatter(
                x=[None],
                y=[None],
                mode='markers',
                marker=dict(size=10, color=colors.get(cat, '#333333')),
                name=cat,
                legendgroup=cat,
                showlegend=True
            ),
            row=1, col=1
        )

    # layout wykresu
    fig.update_layout(
        height=1080,
        width=1920,
        font=dict(
            family="Roboto",
            size=14,
        ),
        title=dict(
            text="Podsumowanie tygodnia",
            font=dict(
                family="Roboto Slab",
                size=38,
                weight="bold",
            ),
            xanchor='center',
            x=0.5,
            yanchor='top',
            y=0.99,
        ),
        margin=dict(t=50, b=50, l=100, r=100),
        legend=dict(
            orientation="v",
            yanchor="top",
            y=0.85,
            xanchor="left",
            x=0.93,
            bgcolor="rgba(255, 255, 255, 0.8)",
            bordercolor="rgba(0, 0, 0, 0.5)",
            borderwidth=1,
            font=dict(
                family="Roboto",
                size=14
            ),
            traceorder="normal",
            title=dict(
                text="Kategoria",
                font=dict(
                    family="Roboto Slab",
                    size=20,
                    weight="bold",
                )
            )
        )
    )

    for i, annotation in enumerate(fig.layout.annotations):
        annotation.font.update(
            family="Roboto Slab",
            size=32,
            weight="bold",
        )

    # Pierwszy wykres (słupkowy) - górna część
    fig.update_xaxes(domain=[0.05, 0.90], row=1, col=1)
    fig.update_yaxes(domain=[0.70, 0.95], row=1, col=1)

    for trace in fig.select_traces(row=1, col=1):
        if isinstance(trace, go.Bar):
            trace.offset = 0

    fig.update_layout(barmode='relative')
    day_order.reverse()

    fig.update_xaxes(
        categoryorder='array',
        categoryarray=day_order,
        row=1, col=1,
        range=[0, 24],
        dtick=1,
        tickmode='linear',
        title="Godzina",
    )

    fig.update_yaxes(
        tickmode='array',
        tickvals=[2.5, 12.5, 22.5, 32.5, 42.5, 52.5, 62.5],
        ticktext=day_order,
        row=1, col=1,
        title="Dzień tygodnia",
    )
    day_order.reverse()
    # Drugi wykres (kolumnowy) - środkowa część
    fig.update_xaxes(domain=[0.05, 0.90], row=2, col=1)
    fig.update_yaxes(domain=[0.30, 0.60], row=2, col=1)

    fig.update_traces(
        hovertemplate='%{x}: %{y}<extra></extra>',
        selector=dict(type='bar')
    )

    # Dostosowanie wysokości i pozycji wykresów donut
    for i in range(1, 8):
        fig.update_layout({
            f'polar{i}': dict(
                domain=dict(
                    x=[0.05 + (i - 1) * 0.12, 0.05 + (i - 1) * 0.12 + 0.11],
                    y=[0.00, 0.20]
                ),
                hole=0.5,
            )
        }),
        fig.update_traces(
            marker=dict(line=dict(width=2, color='white')),
            textfont=dict(size=12),
            insidetextorientation='radial',
            selector=dict(type='pie'),
            hoverinfo='label+percent',
            textinfo='none',
        )

    # Kontrola rozmiaru i położenia tytułów podwykresów
    for i, annotation in enumerate(fig.layout.annotations):
        annotation.font.size = 14

        # Położenie tytułów dla poszczególnych wykresów
        if i == 0:
            annotation.y = 0.97
        elif i == 1:
            annotation.y = 0.62
        elif i >= 2 and i <= 8:
            annotation.y = 0.255
            annotation.x = 0.00 + (i - 2) * 0.1439 + 0.0675

    # Zapis
    fig.write_html("combined_plots.html")
    pio.write_image(fig, "combined_plots.png", scale=3, width=1920, height=1080)
    pio.write_image(fig, "combined_plots.svg", width=1920, height=1080)

    print("Koniec eksportowania końcowych obrazów.")


if __name__ == '__main__':
    print("Start eksportowania")

    # export_images()

    export_combined()

    print("Koniec eksportowania. Przygotowanie serwera.")

    app.run(debug=True, use_reloader=False)
