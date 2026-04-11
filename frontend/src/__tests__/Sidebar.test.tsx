import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "../components/Sidebar";
import type { ArtistConfig } from "../types";

const grouped: Record<string, ArtistConfig[]> = {
  jp: [
    { id: "yoasobi", name: "YOASOBI", spotify_artist_id: "s1", region: "jp" },
    { id: "vaundy", name: "Vaundy", spotify_artist_id: "s2", region: "jp" },
  ],
  global: [
    { id: "blackpink", name: "BLACKPINK", spotify_artist_id: "s3", region: "global" },
  ],
};

const baseProps = {
  searchQuery: "",
  onSearchChange: () => {},
  labels: ["Ariola Japan", "Echoes"],
  selectedLabel: null,
  onLabelChange: () => {},
  grouped,
  dataById: {},
  selectedId: null,
  onSelect: () => {},
};

describe("Sidebar", () => {
  it("検索フィールドを表示する", () => {
    render(<Sidebar {...baseProps} />);
    expect(screen.getByPlaceholderText(/Search artists/i)).toBeInTheDocument();
  });

  it("ラベルタグを表示する", () => {
    render(<Sidebar {...baseProps} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Ariola Japan")).toBeInTheDocument();
    expect(screen.getByText("Echoes")).toBeInTheDocument();
  });

  it("リージョン別にアーティストを表示する", () => {
    render(<Sidebar {...baseProps} />);
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("Global")).toBeInTheDocument();
    expect(screen.getByText("YOASOBI")).toBeInTheDocument();
    expect(screen.getByText("BLACKPINK")).toBeInTheDocument();
  });

  it("検索フィールドの変更で onSearchChange が呼ばれる", () => {
    const onSearchChange = vi.fn();
    render(<Sidebar {...baseProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText(/Search artists/i), {
      target: { value: "yoa" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("yoa");
  });

  it("ラベルクリックで onLabelChange が呼ばれる", () => {
    const onLabelChange = vi.fn();
    render(<Sidebar {...baseProps} onLabelChange={onLabelChange} />);
    fireEvent.click(screen.getByText("Echoes"));
    expect(onLabelChange).toHaveBeenCalledWith("Echoes");
  });

  it("選択中のラベルにアクティブクラスが付く", () => {
    render(<Sidebar {...baseProps} selectedLabel="Ariola Japan" />);
    const tag = screen.getByText("Ariola Japan");
    expect(tag.className).toContain("label-tag--active");
  });

  it("compareMode で「比較対象を選択」のヒントが出る", () => {
    render(<Sidebar {...baseProps} compareMode />);
    expect(screen.getByText(/比較対象を選択/)).toBeInTheDocument();
  });

  it("compareMode で onToggleCompare が呼ばれる", () => {
    const onToggleCompare = vi.fn();
    render(
      <Sidebar
        {...baseProps}
        compareMode
        compareIds={[]}
        onToggleCompare={onToggleCompare}
      />,
    );
    fireEvent.click(screen.getByText("YOASOBI"));
    expect(onToggleCompare).toHaveBeenCalledWith("yoasobi");
  });

  it("ハンバーガーボタンが存在する（モバイル用）", () => {
    render(<Sidebar {...baseProps} />);
    expect(screen.getByLabelText("メニュー")).toBeInTheDocument();
  });
});
