package info.hellovass.reviewme.data

import kotlinx.serialization.Serializable

@Serializable
data class LoveMemoryData(
    val meetingDate: String,
    val marriageDate: String,
    val couple: Couple,
    val banner: Banner,
    val timeline: Timeline,
    val features: List<Feature>
)

@Serializable
data class Couple(
    val me: Person,
    val wife: Person
)

@Serializable
data class Person(
    val name: String,
    val avatar: String
)

@Serializable
data class Banner(
    val title: String,
    val backgroundImage: String? = null
)

@Serializable
data class Timeline(
    val title: String,
    val subtitle: String
)

@Serializable
data class Feature(
    val id: String,
    val title: String,
    val description: String,
    val icon: String,
    val color: String
)
