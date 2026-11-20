"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Edit,
  CheckCircle,
  Eye,
  Trash2,
  X,
  Globe,
  Save,
} from "lucide-react";
import { Lesson, MOCK_LESSONS } from "../../mocks/lessons";
import { SUPPORTED_LANGUAGES } from "../../lib/i18n";
import { TrustButton } from "../TrustButton";

export const A2LessonsAdmin: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [activeLangTab, setActiveLangTab] = useState("en");
  const [isPublishedMap, setIsPublishedMap] = useState<Record<string, boolean>>({
    lesson_1: true,
    lesson_2: true,
    scam_guaranteed_returns: true,
    scam_fake_apps: true,
    scam_vip_groups: true,
    start_safely: true,
  });

  const handleTogglePublish = (id: string) => {
    setIsPublishedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveLesson = () => {
    if (editingLesson) {
      setLessons((prev) =>
        prev.map((l) => (l.id === editingLesson.id ? editingLesson : l))
      );
      setEditingLesson(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-charcoal">Lessons Management</h2>
          <p className="text-[15px] text-charcoal-secondary">
            Create and edit interactive story lessons across all 6 Indic languages
          </p>
        </div>

        <button
          onClick={() => {
            const newL: Lesson = {
              id: `lesson_${Date.now()}`,
              topic_no: lessons.length + 1,
              is_micro: false,
              title: { en: "New Story Lesson", te: "కొత్త కథా పాఠం" },
              core_idea: { en: "Market core idea", te: "మార్కెట్ భావన" },
              estimated_time: "2 min",
              job_adaptation: { vegetable_seller: "Example context" },
              scenes: [
                {
                  scene_no: 1,
                  illustration_type: "general",
                  caption: { en: "Scene caption", te: "దృశ్యం వివరణ" },
                  script: { en: "Scene audio voiceover script", te: "వాయిస్ స్క్రిప్ట్" },
                },
              ],
            };
            setEditingLesson(newL);
          }}
          className="px-4 py-2.5 rounded-btn bg-teal-deep text-white font-bold flex items-center gap-2 hover:bg-teal-hover shadow-sm"
        >
          <Plus size={20} />
          <span>New Lesson</span>
        </button>
      </div>

      {/* Lessons Table */}
      <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream border-b border-border text-[14px] font-bold text-charcoal uppercase">
              <th className="py-3.5 px-4">Topic #</th>
              <th className="py-3.5 px-4">Title</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Language Status</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[15px]">
            {lessons.map((lesson) => {
              const isPublished = isPublishedMap[lesson.id] !== false;

              return (
                <tr key={lesson.id} className="hover:bg-cream/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-deep">
                    #{lesson.topic_no}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-charcoal">
                    <div>{lesson.title.en}</div>
                    <div className="text-[13px] text-charcoal-secondary font-normal">
                      {lesson.title.te || lesson.title.hi || ""}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${
                        lesson.is_micro
                          ? "bg-marigold/20 text-charcoal"
                          : "bg-teal-light text-teal-deep"
                      }`}
                    >
                      {lesson.is_micro ? "30s Micro" : "Full Story"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const hasLang = Boolean(lesson.title[lang.code]);
                        return (
                          <span
                            key={lang.code}
                            title={`${lang.name}: ${hasLang ? "Complete" : "English fallback"}`}
                            className={`w-3 h-3 rounded-full ${
                              hasLang ? "bg-verdict-no_signs-text" : "bg-border-dark"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleTogglePublish(lesson.id)}
                      className={`px-3 py-1 rounded-full text-[13px] font-bold transition-colors ${
                        isPublished
                          ? "bg-verdict-no_signs-bg text-verdict-no_signs-text"
                          : "bg-verdict-could_not_check-bg text-verdict-could_not_check-text"
                      }`}
                    >
                      {isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setEditingLesson(lesson)}
                      className="p-2 rounded-lg text-teal-deep hover:bg-cream border border-border mr-2"
                      title="Edit Lesson"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen size={24} className="text-teal-deep" />
                <h3 className="text-heading text-charcoal">
                  Edit Lesson: {editingLesson.title.en}
                </h3>
              </div>
              <button
                onClick={() => setEditingLesson(null)}
                className="p-1 text-charcoal-secondary hover:text-charcoal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Language Tabs */}
            <div className="flex border-b border-border gap-1 overflow-x-auto pb-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setActiveLangTab(lang.code)}
                  className={`px-3 py-1.5 rounded-t-lg font-bold text-[14px] transition-colors ${
                    activeLangTab === lang.code
                      ? "bg-teal-deep text-white"
                      : "bg-cream text-charcoal hover:bg-cream-dark"
                  }`}
                >
                  {lang.name} ({lang.code})
                </button>
              ))}
            </div>

            {/* Title & Core Idea per language */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[14px] font-bold text-charcoal mb-1">
                  Lesson Title ({activeLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={editingLesson.title[activeLangTab] || ""}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      title: {
                        ...editingLesson.title,
                        [activeLangTab]: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border text-[16px] text-charcoal"
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-charcoal mb-1">
                  Core Idea Explanation
                </label>
                <textarea
                  rows={2}
                  value={editingLesson.core_idea[activeLangTab] || ""}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      core_idea: {
                        ...editingLesson.core_idea,
                        [activeLangTab]: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border text-[15px] text-charcoal"
                />
              </div>
            </div>

            {/* Scenes Editor */}
            <div className="flex flex-col gap-3 pt-2">
              <h4 className="font-bold text-[16px] text-charcoal">
                Scenes ({editingLesson.scenes.length})
              </h4>

              {editingLesson.scenes.map((scene, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-cream/40 rounded-xl border border-border flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between font-bold text-[14px] text-teal-deep">
                    <span>Scene {scene.scene_no}</span>
                    <span className="font-mono text-charcoal-secondary text-[12px]">
                      Type: {scene.illustration_type}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-charcoal-secondary mb-0.5">
                      Visual Caption
                    </label>
                    <input
                      type="text"
                      value={scene.caption[activeLangTab] || ""}
                      onChange={(e) => {
                        const updatedScenes = [...editingLesson.scenes];
                        updatedScenes[idx].caption[activeLangTab] = e.target.value;
                        setEditingLesson({ ...editingLesson, scenes: updatedScenes });
                      }}
                      className="w-full p-2 rounded-lg border border-border bg-white text-[15px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-charcoal-secondary mb-0.5">
                      Voiceover Audio Script
                    </label>
                    <textarea
                      rows={2}
                      value={scene.script[activeLangTab] || ""}
                      onChange={(e) => {
                        const updatedScenes = [...editingLesson.scenes];
                        updatedScenes[idx].script[activeLangTab] = e.target.value;
                        setEditingLesson({ ...editingLesson, scenes: updatedScenes });
                      }}
                      className="w-full p-2 rounded-lg border border-border bg-white text-[15px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setEditingLesson(null)}
                className="px-5 py-2.5 rounded-btn bg-cream-dark text-charcoal font-semibold text-[15px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                className="px-6 py-2.5 rounded-btn bg-teal-deep text-white font-bold text-[15px] flex items-center gap-2"
              >
                <Save size={18} />
                <span>Save Lesson</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
