import WidgetKit
import SwiftUI

struct NotoWidgetEntry: TimelineEntry {
    let date: Date
    let noteCount: Int
    let lastNote: String
}

struct NotoWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> NotoWidgetEntry {
        NotoWidgetEntry(date: Date(), noteCount: 0, lastNote: "Tap to record")
    }

    func getSnapshot(in context: Context, completion: @escaping (NotoWidgetEntry) -> Void) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NotoWidgetEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadEntry() -> NotoWidgetEntry {
        let defaults = UserDefaults(suiteName: "group.com.kushalbhai.noto")
        let count = defaults?.integer(forKey: "noteCount") ?? 0
        let lastNote = defaults?.string(forKey: "lastNote") ?? "Tap to record"
        return NotoWidgetEntry(date: Date(), noteCount: count, lastNote: lastNote)
    }
}

struct NotoWidgetSmallView: View {
    let entry: NotoWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "mic.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color("AccentColor"))
                Spacer()
                Text("noto")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text("Record a thought")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.primary)

            if entry.noteCount > 0 {
                Text("\(entry.noteCount) notes captured")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            } else {
                Text("Tap to start")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .widgetURL(URL(string: "noto://voice/record"))
    }
}

struct NotoWidgetMediumView: View {
    let entry: NotoWidgetEntry

    var body: some View {
        HStack(spacing: 16) {
            // Record action
            Link(destination: URL(string: "noto://voice/record")!) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Color("AccentColor"))
                            .frame(width: 44, height: 44)
                        Image(systemName: "mic.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                    }
                    Text("Record")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.primary)
                }
            }

            // Quick actions
            VStack(alignment: .leading, spacing: 6) {
                Link(destination: URL(string: "noto://note/editor")!) {
                    HStack(spacing: 8) {
                        Image(systemName: "square.and.pencil")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                        Text("New note")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.primary)
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }

                Link(destination: URL(string: "noto://task/editor")!) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                        Text("Add task")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.primary)
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }

                if entry.noteCount > 0 {
                    Text("\(entry.noteCount) notes · Last: \(entry.lastNote)")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .padding(.horizontal, 4)
                }
            }
        }
        .padding()
    }
}

struct NotoWidget: Widget {
    let kind: String = "NotoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NotoWidgetProvider()) { entry in
            if #available(iOS 17.0, *) {
                Group {
                    NotoWidgetSmallView(entry: entry)
                }
                .containerBackground(.fill.tertiary, for: .widget)
            } else {
                NotoWidgetSmallView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("Quick Record")
        .description("Record voice notes, create notes, and add tasks instantly.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct NotoWidgetBundle: WidgetBundle {
    var body: some Widget {
        NotoWidget()
    }
}
