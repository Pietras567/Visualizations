import pandas as pd
import squarify
import matplotlib.pyplot as plt
import matplotlib as mpl
import matplotlib.ticker as mtick
import matplotlib.font_manager as fm
from matplotlib.colors import to_rgb
import numpy as np

fm.fontManager = fm.FontManager()
mpl.rcParams['font.family'] = ['Roboto']

def create_figsize_px(width_px, height_px, dpi=300):
    figsize = (width_px / dpi, height_px / dpi)
    return figsize

def pastelize(color, factor=0.5):
    """Miesza color z bielą; factor 0–1: im wyższy, tym jaśniejszy."""
    r, g, b = to_rgb(color)
    return (r + (1-r)*factor,
            g + (1-g)*factor,
            b + (1-b)*factor)

def generate_bmi_charts():
    df1 = pd.read_csv('bmi_male.csv')
    df2 = pd.read_csv('bmi_female.csv')

    labels1 = df1['kategoria'].astype(str).tolist()
    sizes1 = df1['procent'].astype(float).tolist()

    labels2 = df2['kategoria'].astype(str).tolist()
    sizes2 = df2['procent'].astype(float).tolist()

    base_blue = 'blue'
    base_maroon = 'firebrick'

    colors1 = [pastelize(base_blue, factor=0.5)] * len(labels1)
    colors2 = [pastelize(base_maroon, factor=0.5)] * len(labels2)

    figsize_bmi = create_figsize_px(920, 420, 100)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize_bmi, dpi=100)

    squarify.plot(
        sizes=sizes1,
        label=[f"{l} ({s:.1f}%)" for l, s in zip(labels1, sizes1)],
        color=colors1,
        alpha=0.8,
        pad=True,
        ax=ax1,
        text_kwargs={'fontsize': 10, 'fontweight': 'normal'}
    )
    ax1.axis('off')
    ax1.set_title('Mężczyźni', fontsize=16)

    squarify.plot(
        sizes=sizes2,
        label=[f"{l} ({s:.1f}%)" for l, s in zip(labels2, sizes2)],
        color=colors2,
        alpha=0.8,
        pad=True,
        ax=ax2,
        text_kwargs={'fontsize': 10, 'fontweight': 'normal'}
    )
    ax2.axis('off')
    ax2.set_title('Kobiety', fontsize=16)

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.show()

def generate_age_charts(gap=6.0, label_offset=2):
    df1 = pd.read_csv('pojadanie_male.csv')
    df2 = pd.read_csv('pojadanie_female.csv')

    age_groups = df1['wiek'].tolist()
    men_percents = df1['procent'].tolist()
    women_percents = df2['procent'].tolist()

    figsize_age = create_figsize_px(920, 250, 100)

    fig, ax = plt.subplots(figsize=figsize_age, dpi=100)

    men_lefts = [-p for p in men_percents]
    men_widths = [p - gap for p in men_percents]
    women_lefts = [gap] * len(women_percents)
    women_widths = [p - gap for p in women_percents]
    labels1 = df1['wiek'].astype(str).tolist()
    labels2 = df2['wiek'].astype(str).tolist()

    base_blue = 'blue'
    base_maroon = 'firebrick'
    colors1 = [pastelize(base_blue, factor=0.5)] * len(labels1)
    colors2 = [pastelize(base_maroon, factor=0.5)] * len(labels2)

    bars_m = ax.barh(age_groups, men_widths, left=men_lefts,
                     color=colors1, label='Mężczyźni', align='center')
    bars_f = ax.barh(age_groups, women_widths, left=women_lefts,
                     color=colors2, label='Kobiety', align='center')

    max_pct = max(men_percents + women_percents)
    margin = gap
    ax.set_xlim(-max_pct - margin, max_pct + margin)

    ax.xaxis.set_major_formatter(mtick.FuncFormatter(lambda x, pos: f"{abs(x):.0f}%"))

    ax.bar_label(
        bars_f,
        labels=[f"{p:.1f}%" for p in women_percents],
        label_type='edge',
        padding=6,
        clip_on=False
    )

    for bar, pct in zip(bars_m, men_percents):
        x = bar.get_x()
        y = bar.get_y() + bar.get_height() / 2
        ax.text(x - label_offset, y, f"{pct:.1f}%",
                ha='right', va='center')


    ax.set_yticks([])
    for idx, age in enumerate(age_groups):
        ax.text(0, idx, age, ha='center', va='center')


    for spine in ['top', 'right', 'left']:
        ax.spines[spine].set_visible(False)

    ax.set_xlabel('Procent próby')

    fig.text(0.35, 0.90, 'Mężczyźni', ha='center', va='bottom',
             fontsize=16)
    fig.text(0.65, 0.90, 'Kobiety', ha='center', va='bottom',
             fontsize=16)

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.show()

def generate_radar_charts():
    df1 = pd.read_csv('warzywa_male.csv')
    df2 = pd.read_csv('warzywa_female.csv')
    df3 = pd.read_csv('owoce_male.csv')
    df4 = pd.read_csv('owoce_female.csv')
    df5 = pd.read_csv('nabial_male.csv')
    df6 = pd.read_csv('nabial_female.csv')



    base_blue = 'blue'
    base_maroon = 'firebrick'
    colors = [
        pastelize(base_blue, factor=0.5),
        pastelize(base_maroon, factor=0.5)
    ]

    label_odd = 'Mężczyźni'
    label_even = 'Kobiety'

    figsize_radar_charts = create_figsize_px(1840, 840, 100)

    fig, axes = plt.subplots(
        nrows=1,
        ncols=3,
        figsize=figsize_radar_charts,
        subplot_kw={'projection': 'polar'}
    )

    specs = [
        (df1, df2, 'Warzywa'),
        (df3, df4, 'Owoce'),
        (df5, df6, 'Nabiał'),
    ]

    weekly_cols = [
        '1 raz w tygodniu',
        '2-3 razy w tygodniu',
        '4-5 razy w tygodniu',
        '1 raz dziennie',
        'Kilka razy dziennie'
    ]

    all_handles = []
    all_labels = []

    for ax, (dfa, dfb, title) in zip(axes, specs):
        products = dfa['Produkt'].tolist()
        M = len(products)

        angles = np.linspace(0, 2 * np.pi, M, endpoint=False).tolist()
        angles += angles[:1]

        pct_weekly_odd = dfa[weekly_cols].sum(axis=1).tolist()
        pct_weekly_even = dfb[weekly_cols].sum(axis=1).tolist()

        pct_weekly_odd += pct_weekly_odd[:1]
        pct_weekly_even += pct_weekly_even[:1]

        line_odd, = ax.plot(
            angles,
            pct_weekly_odd,
            color=colors[0],
            linewidth=2,
            linestyle='solid',
            label=label_odd
        )
        ax.fill(
            angles,
            pct_weekly_odd,
            color=colors[0],
            alpha=0.25,
            edgecolor=colors[0],
            linewidth=2,
            linestyle='solid'
        )

        line_even, = ax.plot(
            angles,
            pct_weekly_even,
            color=colors[1],
            linewidth=2,
            linestyle='solid',
            label=label_even
        )
        ax.fill(
            angles,
            pct_weekly_even,
            color=colors[1],
            alpha=0.25,
            edgecolor=colors[1],
            linewidth=2,
            linestyle='solid'
        )

        if not all_handles:
            all_handles.extend([line_odd, line_even])
            all_labels.extend([label_odd, label_even])

        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(products, fontsize=12, horizontalalignment="center", verticalalignment="top", rotation=40, rotation_mode='anchor')
        ax.tick_params(axis='x', pad=25)

        ax.set_title(title, y=1.15, fontsize=32)

        ax.set_rlabel_position(30)
        ax.set_ylim(0, 100)
        ax.set_yticks([20, 40, 60, 80, 100])
        ax.set_yticklabels(['20%', '40%', '60%', '80%', '100%'], fontsize=12)

    fig.legend(
        all_handles,
        all_labels,
        loc='upper center',
        ncol=2,
        bbox_to_anchor=(0.5, 0.95),
        fontsize=16,
        frameon=False
    )

    fig.text(
        0.01,
        0.01,
        'Wartości jako procent próby deklarującej spożycie danego produktu przynajmniej raz na tydzień',
        ha='left',
        va='bottom',
        fontsize=14,
        color='gray'
    )

    plt.tight_layout()
    plt.show()

if __name__ == '__main__':
    generate_bmi_charts()
    generate_age_charts()
    generate_radar_charts()
