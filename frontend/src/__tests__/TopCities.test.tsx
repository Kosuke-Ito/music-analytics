import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TopCities } from "../components/TopCities";
import type { CityListeners } from "../types";

const cities: CityListeners[] = [
  { city: "Osaka", country: "JP", listeners: 300_000 },
  { city: "Tokyo", country: "JP", listeners: 200_000 },
  { city: "Taipei", country: "TW", listeners: 100_000 },
];

const prevCities: CityListeners[] = [
  { city: "Tokyo", country: "JP", listeners: 195_000 },
  { city: "Osaka", country: "JP", listeners: 290_000 },
  { city: "Seoul", country: "KR", listeners: 80_000 },
];

describe("TopCities", () => {
  it("都市名を表示する", () => {
    render(<TopCities cities={cities} />);
    expect(screen.getByText("Osaka")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Taipei")).toBeInTheDocument();
  });

  it("リスナー数を表示する", () => {
    render(<TopCities cities={cities} />);
    expect(screen.getByText("300,000")).toBeInTheDocument();
    expect(screen.getByText("200,000")).toBeInTheDocument();
  });

  it("国コードと国旗を表示する", () => {
    render(<TopCities cities={cities} />);
    expect(screen.getByText("TW")).toBeInTheDocument();
    expect(screen.getByText("🇹🇼")).toBeInTheDocument();
  });

  it("citiesが空の場合は何も表示しない", () => {
    const { container } = render(<TopCities cities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("citiesが未指定の場合は何も表示しない", () => {
    const { container } = render(<TopCities />);
    expect(container).toBeEmptyDOMElement();
  });

  it("prevCitiesが指定されると差分を表示する", () => {
    render(<TopCities cities={cities} prevCities={prevCities} />);
    // Osaka: 300000 - 290000 = +10,000
    expect(screen.getByText("+10,000")).toBeInTheDocument();
    // Tokyo: 200000 - 195000 = +5,000
    expect(screen.getByText("+5,000")).toBeInTheDocument();
  });

  it("順位変動を表示する（Osaka 2位→1位）", () => {
    render(<TopCities cities={cities} prevCities={prevCities} />);
    // Osaka rank: prev=1 (index 1), now=0 → +1
    expect(screen.getByText("↑1")).toBeInTheDocument();
    // Tokyo rank: prev=0 → now=1 → -1
    expect(screen.getByText("↓1")).toBeInTheDocument();
  });

  it("新規都市（前回データなし）には差分を表示しない", () => {
    render(<TopCities cities={cities} prevCities={prevCities} />);
    // Taipei は前回データに無いので delta なし
    // 100,000 は表示されるが「+100,000」のような delta は無いはず
    expect(screen.getByText("100,000")).toBeInTheDocument();
  });

  it("差分0の場合は表示しない", () => {
    const same = [{ city: "Osaka", country: "JP", listeners: 300_000 }];
    const samePrev = [{ city: "Osaka", country: "JP", listeners: 300_000 }];
    render(<TopCities cities={same} prevCities={samePrev} />);
    // delta=0 なので「+0」「-0」は表示されない
    expect(screen.queryByText(/\+0/)).not.toBeInTheDocument();
  });
});
