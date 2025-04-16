import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import pandas as pd

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
        customdata=[cat] * len(data_cat["x"]),
        hovertemplate=(
            "Kategoria: " + cat +
            "<br>Start: %{base:.2f}" +
            "<br>Trwanie: %{x:.2f}h" +
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
    xaxis=dict(title="Czas w ciągu dnia (godziny)", range=[0, 24]),
    yaxis=dict(
        title="Dni tygodnia",
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
            hole=0.4,
            marker=dict(colors=[kolory.get(cat, "lightgray") for cat in group["Category"]]),
            textinfo="label+percent",
            hovertemplate="Kategoria: %{label}<br>Udział: %{percent:.1%}<extra></extra>"
        ), row=1, col=i)

fig3.update_layout(
    title={
        "text": "Procentowy udział kategorii w czasie aktywności – poszczególne dni",
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

if __name__ == '__main__':
    app.run(debug=True)
